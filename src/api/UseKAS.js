import axios from "axios";
import {
    ACCESS_KEY_ID,
    SECRET_ACCESS_KEY,
    NFT_CONTRACT_ADDRESS,
    CHAIN_ID,
  } from "../constants";

const option = {
    headers: {
        Authorization: "Basic " + Buffer.from(ACCESS_KEY_ID + ":" + SECRET_ACCESS_KEY).toString("base64"),
        "x-chain-id": CHAIN_ID,
        "content-type": "application/json"
    }

}

export const uploadMetaData = async (image, name, category, title, datetime, description, place) => {
    const _description = "asdf";
    const _name = "KlayNFT"

    const metadata = {
        metadata: {
            name: _name,
            shop_name: name,
            _description: _description,
            image:image,
            category:category,
            title:title,
            datetime:datetime,
            description:description,
            place:place,
        }
    }

    try {
        const response = await axios.post('https://metadata-api.klaytnapi.com/v1/metadata', metadata, option);
        console.log(`${JSON.stringify(response.data)}`);
        return response.data.uri;
    } catch(e) {
        console.log(e);
        return false;
    }
}