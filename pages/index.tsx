import {
  decryptPvtKey,
  decryptPvtKeyIPFS,
  encryptPvtKey,
  encryptPvtKeyIPFS,
} from "@/utils/utils";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useEffect, useState } from "react";
import { StreamrClient } from "streamr-client";
import { useAccount } from "wagmi";
import * as LitJsSdk from "@lit-protocol/lit-node-client";

type Props = {
  tempWltAddr: string;
  privateKey: string;
};

declare global {
  interface Window {
    litNodeClient: any;
  }
}

const litClient = async () => {
  const client = new LitJsSdk.LitNodeClient({});
  await client.connect();
  window.litNodeClient = client;
};

export default function Home({ tempWltAddr, privateKey }: Props) {
  const { address, isConnected } = useAccount();
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  const [encryptedString, setEncryptedString] = useState<Blob | null>(null);
  const [encryptedSymmetricKey, setEncryptedSymmetricKey] =
    useState<string>("");

  const [decryptedString, setDecryptedString] = useState<string>("");

  const [currCid, setCurrCid] = useState<string>("");

  const handleEncrypt = async () => {
    const { encryptedString, encryptedSymmetricKeyStr } = await encryptPvtKey(
      privateKey,
      address as string
    );

    console.log("Encrypted String: ", encryptedString);
    setEncryptedString(encryptedString);
    setEncryptedSymmetricKey(encryptedSymmetricKey);
  };

  const handleEncryptIPFS = async () => {
    const { cid, error } = await encryptPvtKeyIPFS(
      privateKey,
      address as string
    );

    cid && setCurrCid(cid);

    if (error) {
      console.log("Error: ", error);
    }
  };

  const handleDecrypt = async () => {
    const { decryptedString: dstring } = await decryptPvtKey(
      address as string,
      encryptedString!,
      encryptedSymmetricKey
    );

    dstring && setDecryptedString(dstring);
  };

  const handleDecryptIPFS = async () => {
    const { decryptedString: dstring, error } = await decryptPvtKeyIPFS(
      currCid,
      address as string
    );

    console.log("Decrypted String: ", dstring);
    console.log("Private String: ", privateKey);

    dstring && setDecryptedString(dstring);

    if (error) {
      console.log("Error: ", error);
    }
  };

  useEffect(() => {
    litClient();
  }, []);

  useEffect(() => {
    document.addEventListener(
      "lit-ready",
      function (e) {
        console.log("LIT network is ready");
      },
      false
    );
    return document.removeEventListener("lit-ready", () => {});
  }, []);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="pt-10 pl-10 flex-col gap-40 justify-center">
      <ConnectButton />
      <div>
        {isLoaded && address && <div>temp wallet address: {tempWltAddr}</div>}
      </div>
      <div className="flex gap-20">
        <div>
          <button onClick={handleEncrypt}>Encrypt</button>
        </div>
        <div>
          <button onClick={handleDecrypt}>Decrypt</button>
        </div>
        <div>
          <button onClick={handleEncryptIPFS}>Encrypt & Upload</button>
        </div>
        <div>
          <button onClick={handleDecryptIPFS}>Decrypt CID</button>
        </div>
      </div>
      {/* <div>
        {encryptedSymmetricKey !== "" && (
          <div>Encrypted Symmetric Key: {encryptedSymmetricKey}</div>
        )}
      </div> */}
      <div>
        {decryptedString !== "" && (
          <>
            <div>Decrypted String: {decryptedString}</div>
            <div>Private Key: {privateKey}</div>
            <div>
              Decrypted String === Pvt Key:{" "}
              {decryptedString === privateKey && "true"}
            </div>
          </>
        )}
      </div>
      <div>{currCid !== "" && <div>Current CID: {currCid}</div>}</div>
    </div>
  );
}

export const getServerSideProps = async () => {
  const { address, privateKey } = StreamrClient.generateEthereumAccount();
  return {
    props: {
      tempWltAddr: address,
      privateKey: privateKey,
    },
  };
};
