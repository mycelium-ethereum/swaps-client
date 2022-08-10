import React, { useState } from "react";
import { Link } from "react-router-dom";
import useSWR from "swr";
import { ethers } from "ethers";
import { useWeb3React } from "@web3-react/core";

import { getContract } from "../../Addresses";
import { callContract } from "../../Api";

import Modal from "../../components/Modal/Modal";
import Footer from "../../Footer";

import Token from "../../abis/Token.json";
import Vester from "../../abis/Vester.json";
import RewardTracker from "../../abis/RewardTracker.json";
import RewardRouter from "../../abis/RewardRouter.json";

import { FaCheck, FaTimes } from "react-icons/fa";

import { fetcher, approveTokens, useChainId } from "../../Helpers";

import "./BeginAccountTransfer.css";

function ValidationRow({ isValid, children }) {
  return (
    <div className="ValidationRow">
      <div className="ValidationRow-icon-container">
        {isValid && <FaCheck className="ValidationRow-icon" />}
        {!isValid && <FaTimes className="ValidationRow-icon" />}
      </div>
      <div>{children}</div>
    </div>
  );
}

export default function BeginAccountTransfer(props) {
  const { setPendingTxns } = props;
  const { active, library, account } = useWeb3React();
  const { chainId } = useChainId();

  const [receiver, setReceiver] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isTransferSubmittedModalVisible, setIsTransferSubmittedModalVisible] = useState(false);
  let parsedReceiver = ethers.constants.AddressZero;
  if (ethers.utils.isAddress(receiver)) {
    parsedReceiver = receiver;
  }

  const mlpAddress = getContract(chainId, "MYC");
  const mlpVesterAddress = getContract(chainId, "MycVester");
  const mlpVesterAddress = getContract(chainId, "MlpVester");

  const rewardRouterAddress = getContract(chainId, "RewardRouter");

  const { data: mlpVesterBalance } = useSWR([active, chainId, mlpVesterAddress, "balanceOf", account], {
    fetcher: fetcher(library, Token),
  });

  const { data: mlpVesterBalance } = useSWR([active, chainId, mlpVesterAddress, "balanceOf", account], {
    fetcher: fetcher(library, Token),
  });

  const stakedMycTrackerAddress = getContract(chainId, "StakedMycTracker");
  const { data: cumulativeMycRewards } = useSWR(
    [active, chainId, stakedMycTrackerAddress, "cumulativeRewards", parsedReceiver],
    {
      fetcher: fetcher(library, RewardTracker),
    }
  );

  const stakedMlpTrackerAddress = getContract(chainId, "StakedMlpTracker");
  const { data: cumulativeMlpRewards } = useSWR(
    [active, chainId, stakedMlpTrackerAddress, "cumulativeRewards", parsedReceiver],
    {
      fetcher: fetcher(library, RewardTracker),
    }
  );

  const { data: transferredCumulativeMycRewards } = useSWR(
    [active, chainId, mlpVesterAddress, "transferredCumulativeRewards", parsedReceiver],
    {
      fetcher: fetcher(library, Vester),
    }
  );

  const { data: transferredCumulativeMlpRewards } = useSWR(
    [active, chainId, mlpVesterAddress, "transferredCumulativeRewards", parsedReceiver],
    {
      fetcher: fetcher(library, Vester),
    }
  );

  const { data: pendingReceiver } = useSWR([active, chainId, rewardRouterAddress, "pendingReceivers", account], {
    fetcher: fetcher(library, RewardRouter),
  });

  const { data: mlpAllowance } = useSWR([active, chainId, mlpAddress, "allowance", account, stakedMycTrackerAddress], {
    fetcher: fetcher(library, Token),
  });

  const { data: mlpStaked } = useSWR(
    [active, chainId, stakedMycTrackerAddress, "depositBalances", account, mlpAddress],
    {
      fetcher: fetcher(library, RewardTracker),
    }
  );

  const needApproval = mlpAllowance && mlpStaked && mlpStaked.gt(mlpAllowance);

  const hasVestedMyc = mlpVesterBalance && mlpVesterBalance.gt(0);
  const hasVestedMlp = mlpVesterBalance && mlpVesterBalance.gt(0);
  const hasStakedMyc =
    (cumulativeMycRewards && cumulativeMycRewards.gt(0)) ||
    (transferredCumulativeMycRewards && transferredCumulativeMycRewards.gt(0));
  const hasStakedMlp =
    (cumulativeMlpRewards && cumulativeMlpRewards.gt(0)) ||
    (transferredCumulativeMlpRewards && transferredCumulativeMlpRewards.gt(0));
  const hasPendingReceiver = pendingReceiver && pendingReceiver !== ethers.constants.AddressZero;

  const getError = () => {
    if (!account) {
      return "Wallet is not connected";
    }
    if (hasVestedMyc) {
      return "Vested MYC not withdrawn";
    }
    if (hasVestedMlp) {
      return "Vested MLP not withdrawn";
    }
    if (!receiver || receiver.length === 0) {
      return "Enter Receiver Address";
    }
    if (!ethers.utils.isAddress(receiver)) {
      return "Invalid Receiver Address";
    }
    if (hasStakedMyc || hasStakedMlp) {
      return "Invalid Receiver";
    }
    if ((parsedReceiver || "").toString().toLowerCase() === (account || "").toString().toLowerCase()) {
      return "Self-transfer not supported";
    }

    if (
      (parsedReceiver || "").length > 0 &&
      (parsedReceiver || "").toString().toLowerCase() === (pendingReceiver || "").toString().toLowerCase()
    ) {
      return "Transfer already initiated";
    }
  };

  const isPrimaryEnabled = () => {
    const error = getError();
    if (error) {
      return false;
    }
    if (isApproving) {
      return false;
    }
    if (isTransferring) {
      return false;
    }
    return true;
  };

  const getPrimaryText = () => {
    const error = getError();
    if (error) {
      return error;
    }
    if (needApproval) {
      return "Approve MYC";
    }
    if (isApproving) {
      return "Approving...";
    }
    if (isTransferring) {
      return "Transferring";
    }

    return "Begin Transfer";
  };

  const onClickPrimary = () => {
    if (needApproval) {
      approveTokens({
        setIsApproving,
        library,
        tokenAddress: mlpAddress,
        spender: stakedMycTrackerAddress,
        chainId,
      });
      return;
    }

    setIsTransferring(true);
    const contract = new ethers.Contract(rewardRouterAddress, RewardRouter.abi, library.getSigner());

    callContract(chainId, contract, "signalTransfer", [parsedReceiver], {
      sentMsg: "Transfer submitted!",
      failMsg: "Transfer failed.",
      setPendingTxns,
    })
      .then(async (res) => {
        setIsTransferSubmittedModalVisible(true);
      })
      .finally(() => {
        setIsTransferring(false);
      });
  };

  const completeTransferLink = `/complete_account_transfer/${account}/${parsedReceiver}`;
  const pendingTransferLink = `/complete_account_transfer/${account}/${pendingReceiver}`;

  return (
    <div className="BeginAccountTransfer Page page-layout">
      <Modal
        isVisible={isTransferSubmittedModalVisible}
        setIsVisible={setIsTransferSubmittedModalVisible}
        label="Transfer Submitted"
      >
        Your transfer has been initiated.
        <br />
        <br />
        <Link className="App-cta" to={completeTransferLink}>
          Continue
        </Link>
      </Modal>
      <div className="Page-title-section">
        <div className="Page-title">Transfer Account</div>
        <div className="Page-description">
          Please only use this for full account transfers.
          <br />
          This will transfer all your MYC, esMYC, MLP and Multiplier Points to your new account.
          <br />
          Transfers are only supported if the receiving account has not staked MYC or MLP tokens before.
          <br />
          Transfers are one-way, you will not be able to transfer staked tokens back to the sending account.
        </div>
        {hasPendingReceiver && (
          <div className="Page-description">
            You have a <Link to={pendingTransferLink}>pending transfer</Link> to {pendingReceiver}.
          </div>
        )}
      </div>
      <div className="Page-content">
        <div className="input-form">
          <div className="input-row">
            <label className="input-label">Receiver Address</label>
            <div>
              <input
                type="text"
                value={receiver}
                onChange={(e) => setReceiver(e.target.value)}
                className="text-input"
              />
            </div>
          </div>
          <div className="BeginAccountTransfer-validations">
            <ValidationRow isValid={!hasVestedMyc}>
              Sender has withdrawn all tokens from MYC Vesting Vault
            </ValidationRow>
            <ValidationRow isValid={!hasVestedMlp}>
              Sender has withdrawn all tokens from MLP Vesting Vault
            </ValidationRow>
            <ValidationRow isValid={!hasStakedMyc}>Receiver has not staked MYC tokens before</ValidationRow>
            <ValidationRow isValid={!hasStakedMlp}>Receiver has not staked MLP tokens before</ValidationRow>
          </div>
          <div className="input-row">
            <button
              className="App-cta Exchange-swap-button"
              disabled={!isPrimaryEnabled()}
              onClick={() => onClickPrimary()}
            >
              {getPrimaryText()}
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
