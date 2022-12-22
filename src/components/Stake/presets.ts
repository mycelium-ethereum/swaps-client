import { ethers } from 'ethers'
import { CompatibleToken } from 'src/components/Stake/types'
import mycTokenIcon from "../../img/earn/myc.svg"
import esMycTokenIcon from "../../img/earn/esmyc.svg"
import ethTokenIcon from "../../img/earn/eth.svg"

export const tokenIcon: Record<CompatibleToken, any> = {
  MYC: mycTokenIcon,
  esMYC: esMycTokenIcon,
  WETH: ethTokenIcon,
  ETH: ethTokenIcon,
}

export const tokenAltText: Record<CompatibleToken, any> = {
  MYC: 'Mycelium token logo',
  esMYC: 'Escrowed Mycelium token logo',
  WETH: 'Wrapped Ether token logo',
  ETH: 'Ether token logo',
}

export const ZERO_BN = ethers.BigNumber.from(0)
