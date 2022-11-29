import { Menu } from "@headlessui/react";
import { FiChevronDown } from "react-icons/fi";
import "./AssetDropdown.css";
import coingeckoIcon from "../../img/ic_coingecko_16.svg";
import arbitrumIcon from "../../img/ic_arbitrum_16.svg";
import metamaskIcon from "../../img/ic_metamask_16.svg";
import { addTokenToMetamask, ICONLINKS, platformTokens, useChainId } from "../../Helpers";
import { useWeb3React } from "@web3-react/core";
import { Text } from "../../components/Translation/Text";

function AssetDropdown({ assetSymbol, assetInfo, trackAction }) {
  const { active } = useWeb3React();
  const { chainId } = useChainId();
  let { coingecko, arbitrum } = ICONLINKS[chainId][assetSymbol];
  const unavailableTokenSymbols = {
    42161: ["ETH"],
    421613: ["ETH"],
  };

  return (
    <Menu>
      <Menu.Button as="div" className="dropdown-arrow">
        <FiChevronDown size={20} />
      </Menu.Button>
      <Menu.Items as="div" className="asset-menu-items">
        <Menu.Item>
          <>
            {coingecko && (
              <a
                href={coingecko}
                className="asset-item"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  trackAction &&
                  trackAction("Button clicked", {
                    buttonName: `Open ${assetInfo.symbol} in Coingecko`,
                  })
                }
              >
                <img src={coingeckoIcon} alt="Open in Coingecko" />
                <p>
                  <Text>Open in Coingecko</Text>
                </p>
              </a>
            )}
          </>
        </Menu.Item>
        <Menu.Item>
          <>
            {arbitrum && (
              <a
                href={arbitrum}
                className="asset-item"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  trackAction &&
                  trackAction("Button clicked", {
                    buttonName: `Open ${assetInfo.symbol} in Arbitrum Explorer`,
                  })
                }
              >
                <img src={arbitrumIcon} alt="Open in explorer" />
                <p>
                  <Text>Open in Explorer</Text>
                </p>
              </a>
            )}
          </>
        </Menu.Item>
        <Menu.Item>
          <>
            {active && unavailableTokenSymbols[chainId].indexOf(assetSymbol) < 0 && (
              <div
                onClick={() => {
                  let token = assetInfo
                    ? { ...assetInfo, image: assetInfo.imageUrl }
                    : platformTokens[chainId][assetSymbol];
                  addTokenToMetamask(token);
                  trackAction &&
                    trackAction("Button clicked", {
                      buttonName: `Add ${assetInfo.symbol} to Metamask`,
                    });
                }}
                className="asset-item"
              >
                <img src={metamaskIcon} alt="Add to Metamask" />
                <p>
                  <Text>Add to Metamask</Text>
                </p>
              </div>
            )}
          </>
        </Menu.Item>
      </Menu.Items>
    </Menu>
  );
}

export default AssetDropdown;
