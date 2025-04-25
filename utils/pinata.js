import { PinataSDK } from 'pinata';

export async function getMetadata(data) {
    const minter = data.minterTweet.username;
    const creator = data.creatorTweet.username;
    return {
        minter,
        creator,
        symbol: (
            creator.substring(0, 2) + minter.substring(0, 2)
        ).toUpperCase(),
        minterAddress: data.minterTweet.address,
        creatorAddress: data.creatorTweet.address,
        name: `@${creator} x @${minter}`,
        description: `Basednames X Mint. Created by @${creator}. Minted by @${minter}.`,
    };
}
const pinata = new PinataSDK({
    pinataJwt: process.env.PINATA_API_JWT,
    pinataGateway: 'blue-kind-caribou-725.mypinata.cloud',
});

export async function uploadImageFromData(data) {
    const { name, description } = getMetadata(data);

    const blob = new Blob([data.creatorTweet.mintData], { type: fileType });
    const file = new File([blob], 'mintImage.jpg', { type: 'image/jpeg' });

    const { cid: fileCID } = await pinata.upload.public.file(file);

    const { cid } = await pinata.upload.public.json({
        name,
        description,
        image: `ipfs://${fileCID}`,
        properties: {
            category: 'social',
        },
    });
    return cid;
}

export async function uploadTextFromData(data) {
    const { name, description } = getMetadata(data);

    const file = new File([data.creatorTweet.mintData], 'mintText.txt', {
        type: 'text/plain',
    });
    const { cid: fileCID } = await pinata.upload.public.file(file);

    const { cid } = await pinata.upload.public.json({
        name,
        description,
        content: {
            mime: 'text/plain',
            uri: `ipfs://${fileCID}`,
        },
        properties: {
            category: 'social',
        },
    });
    return cid;
}

// switch for promised methods above

export function pinataUpload(data) {
    if (typeof data.creatorTweet.mintData === 'string') {
        return uploadTextFromData(mintData);
    } else {
        return uploadImageFromData(mintData);
    }
}
