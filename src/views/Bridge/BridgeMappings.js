export const chainIdZapContractsMap = {
    [ChainId.ETH]:       "0x6571d6be3d8460CF5F7d6711Cd9961860029D85F",
    [ChainId.OPTIMISM]:  "0x470f9522ff620eE45DF86C58E54E6A645fE3b4A7",
    [ChainId.CRONOS]:    "0x991adb00eF4c4a6D1eA6036811138Db4379377C2",
    [ChainId.BSC]:       "0x749F37Df06A99D6A8E065dd065f8cF947ca23697",
    [ChainId.POLYGON]:   "0x1c6aE197fF4BF7BA96c66C5FD64Cb22450aF9cC8",
    [ChainId.FANTOM]:    "0xB003e75f7E0B5365e814302192E99b4EE08c0DEd",
    [ChainId.BOBA]:      "0x64B4097bCCD27D49BC2A081984C39C3EeC427a2d",
    [ChainId.METIS]:     "0x6571D58b3BF2469DF5878e213453E28dC1A4DA81",
    [ChainId.MOONBEAM]:  "0xadA10A7474f4c71A829b55D2cB4232C281383fd5",
    [ChainId.MOONRIVER]: "0xfA28DdB74b08B2b6430f5F61A1Dd5104268CC29e",
    [ChainId.ARBITRUM]:  "0x37f9aE2e0Ea6742b9CAD5AbCfB6bBC3475b3862B",
    [ChainId.AVALANCHE]: "0x0EF812f4c68DC84c22A4821EF30ba2ffAB9C2f3A",
    [ChainId.DFK]:       "0x75224b0f245Fe51d5bf47A898DbB6720D4150BA7",
    [ChainId.AURORA]:    "0x2D8Ee8d6951cB4Eecfe4a79eb9C2F973C02596Ed",
    [ChainId.HARMONY]:   "0xB003e75f7E0B5365e814302192E99b4EE08c0DEd",
    [ChainId.KLAYTN]:    "0x911766fA1a425Cb7cCCB0377BC152f37F276f8d6",
}

export const CHAINID_NETWORK_MAP = {
    [1]:        Networks.ETH,
    [42161]:   Networks.ARBITRUM,
}

export const chainIdBridgeContractsMap = {
    [ChainId.ETH]:       "0x2796317b0fF8538F253012862c06787Adfb8cEb6",
    [ChainId.OPTIMISM]:  "0xAf41a65F786339e7911F4acDAD6BD49426F2Dc6b",
    [ChainId.CRONOS]:    "0xE27BFf97CE92C3e1Ff7AA9f86781FDd6D48F5eE9",
    [ChainId.BSC]:       "0xd123f70AE324d34A9E76b67a27bf77593bA8749f",
    [ChainId.POLYGON]:   "0x8F5BBB2BB8c2Ee94639E55d5F41de9b4839C1280",
    [ChainId.FANTOM]:    "0xAf41a65F786339e7911F4acDAD6BD49426F2Dc6b",
    [ChainId.BOBA]:      "0x432036208d2717394d2614d6697c46DF3Ed69540",
    [ChainId.METIS]:     "0x06Fea8513FF03a0d3f61324da709D4cf06F42A5c",
    [ChainId.MOONBEAM]:  "0x84A420459cd31C3c34583F67E0f0fB191067D32f",
    [ChainId.MOONRIVER]: "0xaeD5b25BE1c3163c907a471082640450F928DDFE",
    [ChainId.ARBITRUM]:  "0x6F4e8eBa4D337f874Ab57478AcC2Cb5BACdc19c9",
    [ChainId.AVALANCHE]: "0xC05e61d0E7a63D27546389B7aD62FdFf5A91aACE",
    [ChainId.DFK]:       "0xE05c976d3f045D0E6E7A6f61083d98A15603cF6A",
    [ChainId.AURORA]:    "0xaeD5b25BE1c3163c907a471082640450F928DDFE",
    [ChainId.HARMONY]:   "0xAf41a65F786339e7911F4acDAD6BD49426F2Dc6b",
    [ChainId.KLAYTN]:    "0xAf41a65F786339e7911F4acDAD6BD49426F2Dc6b",
}

//Hardcoded gas airdrop values
export const ChainGasAirdrop = {
    [ChainId.ETH]:        0,
    [ChainId.OPTIMISM]:   .0020,
    [ChainId.BOBA]:       .005,
    [ChainId.MOONRIVER]:  .0020,
    [ChainId.AURORA]:     0,
    [ChainId.ARBITRUM]:   .0030,
    [ChainId.AVALANCHE]:  .025,
    [ChainId.DFK]:        .0100,
    [ChainId.METIS]:      .0200,
    [ChainId.FANTOM]:     .40,
    [ChainId.POLYGON]:    .0200,
    [ChainId.CRONOS]:     0, 
    [ChainId.BSC]:        .002, 
    [ChainId.KLAYTN]:     .1000,
};

export const ChainGasAirdropToken = {
    [ChainId.ETH]:        "ETH",
    [ChainId.OPTIMISM]:   "ETH",
    [ChainId.BOBA]:       "ETH",
    [ChainId.MOONRIVER]:  "MOVR",
    [ChainId.AURORA]:     "N/A",
    [ChainId.ARBITRUM]:   "ETH",
    [ChainId.AVALANCHE]:  "AVAX",
    [ChainId.DFK]:        "JEWEL",
    [ChainId.METIS]:      "METIS",
    [ChainId.FANTOM]:     "FTM",
    [ChainId.POLYGON]:    "MATIC",
    [ChainId.CRONOS]:     "CRO", 
    [ChainId.BSC]:        "BNB", 
    [ChainId.KLAYTN]:     "KLAY",


}
