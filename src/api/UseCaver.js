import Caver from "caver-js";
import KIP17ABI from "../abi/KIP17TokenABI.json";
import MarketABI from "../abi/MarketABI.json";
import axios from "axios";
import {
  ACCESS_KEY_ID,
  SECRET_ACCESS_KEY,
  NFT_CONTRACT_ADDRESS,
  MARKET_CONTRACT_ADDRESS,
  CHAIN_ID,
} from "../constants";
const option = {
  headers: [
    {
      name: "Authorization",
      value:
        "Basic " +
        Buffer.from(ACCESS_KEY_ID + ":" + SECRET_ACCESS_KEY).toString("base64"),
    },
    { name: "x-chain-id", value: CHAIN_ID },
  ],
};

const caver = new Caver(
  new Caver.providers.HttpProvider(
    "https://node-api.klaytnapi.com/v1/klaytn",
    option
  )
);
const NFTContract = new caver.contract(KIP17ABI, NFT_CONTRACT_ADDRESS);
const MarketContract = new caver.contract(MarketABI, MARKET_CONTRACT_ADDRESS);

export const getPriceOf = async (tokenId) => {
  const price = await MarketContract.methods.getPrice(tokenId).call();
  console.log(`[PRICE] : ${price}`)
  return price
}

export const sellCardOf = async (tokenId, price) => {
  try {
    const privatekey = '0x9851da56f1d0d6369fe4b92b477f7fa702f509b2e80f1790ac40cd2aca3d05c4';
    const deployer = caver.wallet.keyring.createFromPrivateKey(privatekey);
    caver.wallet.add(deployer);

    const receipt = await MarketContract.methods.sellNFT(tokenId, caver.utils.convertToPeb(price)).send({
      from: deployer.address, // address
      gas: "1000000"
    })
    console.log(receipt);
  } catch(e) {
    console.log(`[ERROR_SELL_CARD]${e}`);
  }
}

export const fetchCardsOf = async (address) => {
  // Fetch Balance
  const balance = await NFTContract.methods.balanceOf(address).call();
  console.log(`[NFT Balance]${balance}`);
  // Fetch Token IDs
  const tokenIds = [];
  for (let i = 0; i < balance; i++) {
    const id = await NFTContract.methods.tokenOfOwnerByIndex(address, i).call();
    tokenIds.push(id);
  }
  console.log(`[TokenIds]${JSON.stringify(tokenIds)}`)
  // Fetch Token URIs
  const tokenUris = [];
  for (let i = 0; i < balance; i++) {
    const metadataUrl = await NFTContract.methods.tokenURI(tokenIds[i]).call(); // -> metadata
    const response = await axios.get(metadataUrl);
    const uriJSON = response.data;
    tokenUris.push(uriJSON);
    //tokenUris.push(metadataUrl);
  }
  const nfts = [];
  for (let i = 0; i < balance; i++) {
    nfts.push({ uri: tokenUris[i], id: tokenIds[i] });
  }
  console.log(nfts);
  return nfts;
};

export const getBalance = (address) => {
  return caver.rpc.klay.getBalance(address).then((response) => {
    const balance = caver.utils.convertFromPeb(
      caver.utils.hexToNumberString(response)
    );
    console.log(`BALANCE: ${balance}`);
    return balance;
  });
};
