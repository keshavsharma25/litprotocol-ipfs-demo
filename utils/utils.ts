import * as LitJsSdk from "@lit-protocol/lit-node-client";
import { Web3Storage } from "web3.storage";
import axios from "axios";

export const chain = "ethereum";

export const encryptPvtKey = async (str: string, address: string) => {
  const accessControlConditions = [
    {
      contractAddress: "",
      standardContractType: "",
      chain,
      method: "",
      parameters: [":userAddress"],
      returnValueTest: {
        comparator: "=",
        value: address,
      },
    },
  ];

  const authSig = await LitJsSdk.checkAndSignAuthMessage({ chain });
  const { encryptedString, symmetricKey } = await LitJsSdk.encryptString(str);

  console.log("encryptedString", encryptedString);
  console.log("symmetricKey", symmetricKey);

  const encryptedSymmetricKey = await window.litNodeClient.saveEncryptionKey({
    accessControlConditions,
    symmetricKey,
    authSig,
    chain,
  });

  return {
    encryptedString,
    encryptedSymmetricKeyStr: LitJsSdk.uint8arrayToString(
      encryptedSymmetricKey,
      "base16"
    ),
    accessControlConditions,
  };
};

export const encryptPvtKeyIPFS = async (
  str: string,
  address: string
): Promise<{ cid?: string; error?: string }> => {
  const storageClient = new Web3Storage({
    token: process.env.NEXT_PUBLIC_WEB3_STORAGE_URL!,
  });

  const { encryptedString, encryptedSymmetricKeyStr, accessControlConditions } =
    await encryptPvtKey(str, address);

  const encryptedStringJSON = Buffer.from(
    await encryptedString.arrayBuffer()
  ).toJSON();

  try {
    const jsonFile = JSON.stringify({
      encryptedString: encryptedStringJSON,
      encryptedSymmetricKeyStr,
      accessControlConditions,
      chain,
    });

    const cid = await storageClient.put([
      new File([jsonFile], `${address}.json`),
    ]);

    return { cid };
  } catch (error) {
    return { error: "Error uploading to IPFS" };
  }
};

export const decryptPvtKey = async (
  address: string,
  encryptedString: Blob,
  encryptedSymmetricKey: string
) => {
  const authSig = await LitJsSdk.checkAndSignAuthMessage({ chain });

  const accessControlConditions = [
    {
      contractAddress: "",
      standardContractType: "",
      chain,
      method: "",
      parameters: [":userAddress"],
      returnValueTest: {
        comparator: "=",
        value: address,
      },
    },
  ];

  const symmetricKey = await window.litNodeClient.getEncryptionKey({
    accessControlConditions,
    toDecrypt: encryptedSymmetricKey,
    chain,
    authSig,
  });

  const decryptedString = await LitJsSdk.decryptString(
    encryptedString,
    symmetricKey
  );

  return { decryptedString };
};

export const decryptPvtKeyIPFS = async (
  cid: string,
  address: string
): Promise<{ decryptedString?: string; error?: string }> => {
  try {
    const { data } = await axios({
      method: "GET",
      url: `https://ipfs.io/ipfs/${cid}/${address}.json`,
    });

    console.log("data: ", data);

    const encryptedStringBlob = new Blob([Buffer.from(data.encryptedString)]);

    console.log("encryptedStringBlob", encryptedStringBlob);

    const { decryptedString } = await decryptPvtKey(
      address,
      encryptedStringBlob,
      data.encryptedSymmetricKeyStr
    );

    console.log("decryptedString", decryptedString);

    return { decryptedString };
  } catch (error) {
    console.log("error", error);
    return { error: "Error downloading from IPFS" };
  }
};
