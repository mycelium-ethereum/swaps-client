import { useWeb3React } from '@web3-react/core';
import { ethers } from 'ethers';
import React, { useEffect } from 'react';
import { getContract } from '../Addresses';
import { RPC_PROVIDERS } from '../Helpers';
import Vault from '../abis/Vault.json';


export const useCumulativeFundingRates = (chainId, nativeTokenAddress, whitelistedTokenAddresses) => {
    const [cumulativeFundingRates, setCumulativeFundingRates] = React.useState(null);
    const vaultAddress = getContract(chainId, "Vault");


    useEffect(() => {
        handleFetchCumulativeFundingRates();
    }, [chainId]);
    
    async function handleFetchCumulativeFundingRates() {
        try {
            const provider = new ethers.providers.JsonRpcProvider(RPC_PROVIDERS[chainId][0]);
            await provider.ready;
            const vault = new ethers.Contract(vaultAddress, Vault.abi, provider);

            const rates = {};
            await Promise.all(
                whitelistedTokenAddresses.map(async address => {
                    const tokenAddress = address === ethers.constants.AddressZero ? nativeTokenAddress : address;
                    const rate = await vault.cumulativeFundingRates(tokenAddress);
                    rates[address] = rate;
                })
            );

            setCumulativeFundingRates(rates);
        } catch (err) {
            console.error(err);
        }
    }

    return cumulativeFundingRates;
}