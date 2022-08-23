import { Request, Response } from 'express';
import { HttpFactory } from '../../http/http_factory';
import { MarketplaceServices } from '../services/marketplace.services'
import shuffle from 'shuffle-array';

export class MarketplaceController {


    static getTrendingCollections = async (req: Request, res: Response) => {

        const { category, chain, count } = req.body
        try {
            const resp = await MarketplaceServices.getTrendingCollectionData(category, chain, count)

            if (resp != null && resp != undefined) {
                console.log("Received trending collections")
                return HttpFactory.STATUS_200_OK({ collections: resp }, res)

            }
            else {
                return HttpFactory.STATUS_404_NOT_FOUND({ Info: "Response is empty from service" }, res)
            }

        } catch (e) {
            return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR({ message: e }, res)
        }
    }

    static updateTrendingCollections = async (req: Request, res: Response) => {
        if (!req.file)
            return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR({ message: "empty file" }, res)

        const filePath = req.file.path
        try {
            const resp = await MarketplaceServices.updateTrendingCollectionData(filePath)

            if (resp != null && resp != undefined && resp == true) {
                console.log("updated trending collections")
                return HttpFactory.STATUS_200_OK({ updatedCollections: resp }, res)

            }
            else {
                return HttpFactory.STATUS_404_NOT_FOUND({ Info: "Response is empty from service" }, res)
            }

        } catch (e) {
            return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR({ message: e }, res)
        }

    }

    static getCollectionInfo = async (req: Request, res: Response) => {
        const { slug } = req.body
        try {
            const info = await MarketplaceServices.getCollectionInfoFromSlugService(slug)

            if (info != null) {
                console.log("Received collection info  from slug")
                return HttpFactory.STATUS_200_OK({ CollectionInfo: info }, res)

            }
            else {
                return HttpFactory.STATUS_200_OK({ Info: "Response is empty from service" }, res)
            }

        } catch (e) {
            return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR({ message: e }, res)
        }
    }

    static getCollectionNFTs = async (req: Request, res: Response) => {
        const { slug, offset } = req.body
        try {
            let nfts;
            if (offset == 0) {
                nfts = await MarketplaceServices.getTopTwentyCollectionNFTsFromSlug(slug)
            }
            else if (offset > 0) {
                nfts = await MarketplaceServices.getNextCollectionNFTsFromSlug(slug, offset)
            }

            if (nfts != null) {
                console.log("Received collection  from slug")
                return HttpFactory.STATUS_200_OK({ CollectionNFTs: nfts }, res)

            }
            else {
                return HttpFactory.STATUS_200_OK({ Info: "Response is empty from service" }, res)
            }

        } catch (e) {
            console.log(e)
            return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR({ message: e }, res)
        }
    }

    static getNFTListings = async (req: Request, res: Response) => {
        const { contract, tokenId } = req.body
        try {

            const listings = await MarketplaceServices.getNFTListingsService(contract, tokenId)
            if (listings != null) {
                console.log("Received listings of NFT")
                return HttpFactory.STATUS_200_OK({ Listings: listings }, res)

            }
            else {
                return HttpFactory.STATUS_200_OK({ Info: "Response is empty from service" }, res)
            }

        } catch (e) {
            return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR({ message: e }, res)
        }
    }

    static getNFTOffers = async (req: Request, res: Response) => {
        const { contract, tokenId } = req.body
        try {
            const listings = await MarketplaceServices.getNFTOffersService(contract, tokenId)
            if (listings != null) {
                console.log("Received offers of NFT")
                return HttpFactory.STATUS_200_OK({ Listings: listings }, res)

            }
            else {
                return HttpFactory.STATUS_200_OK({ Info: "Response is empty from service" }, res)
            }

        } catch (e) {
            return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR({ message: e }, res)
        }
    }

    static getNFTInfo = async (req: Request, res: Response) => {
        const { contract, token_id, chain } = req.body
        try {
            let resp;
            if (chain == "ethereum") {
                resp = await MarketplaceServices.getNFTFromContractService(contract, token_id)
            } else if (chain == "solana") {
                resp = await MarketplaceServices.getNFTFromTokenMintService(contract)
            }

            if (resp != null && resp != undefined) {

                console.log("Received NFT INFO from contract and token")
                return HttpFactory.STATUS_200_OK({ NFTInfo: resp }, res)

            }
            else {
                return HttpFactory.STATUS_200_OK({ Info: "Response is empty from service" }, res)
            }

        } catch (e) {
            return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR({ message: e }, res)
        }
    }

    static getShowcaseNFTs = async (req: Request, res: Response) => {
        const { chain, limit } = req.body
        try {

            let resp;
            if (chain == "ethereum") {
                resp = await MarketplaceServices.getEthereumShowcaseNFTsService(limit)
            } else if (chain == "solana") {
                resp = await MarketplaceServices.getSolanaShowcaseNFTsService(limit)
            }
            if (resp != null && resp != undefined) {
                const shuffledItems = shuffle(resp);
                console.log("Received collection nfts for showcase")
                return HttpFactory.STATUS_200_OK({ ShowcaseNFTs: shuffledItems }, res)

            }
            else {
                return HttpFactory.STATUS_200_OK({ Info: "Response is empty from service" }, res)
            }

        } catch (e) {
            return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR({ message: e }, res)
        }
    }

    static getNotableCollectionInfo = async (req: Request, res: Response) => {
        const { limit } = req.body
        try {
            const resp = await MarketplaceServices.getNotableCollectionService(limit)

            if (resp != null && resp != undefined) {
                console.log("Received notable collection info")
                return HttpFactory.STATUS_200_OK({ NotableCollections: resp }, res)

            }
            else {
                return HttpFactory.STATUS_200_OK({ Info: "Response is empty from service" }, res)
            }

        } catch (e) {
            return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR({ message: e }, res)
        }
    }

    static searchCollections = async (req: Request, res: Response) => {
        const { searchstr, limit } = req.body
        try {
            const resp = await MarketplaceServices.searchCollectionsService(searchstr, limit)

            if (resp != null && resp != undefined) {
                console.log("Received search collection info")
                return HttpFactory.STATUS_200_OK({ Collections: resp }, res)

            }
            else {
                return HttpFactory.STATUS_200_OK({ Info: "Response is empty from service" }, res)
            }

        } catch (e) {
            return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR({ message: e }, res)
        }
    }

    static searchNFTs = async (req: Request, res: Response) => {
        const { searchstr, limit } = req.body
        try {
            const resp = await MarketplaceServices.searchNFTService(searchstr, limit)

            if (resp != null && resp != undefined) {
                console.log("Received search NFTS info")
                return HttpFactory.STATUS_200_OK({ Collections: resp }, res)

            }
            else {
                return HttpFactory.STATUS_200_OK({ Info: "Response is empty from service" }, res)
            }

        } catch (e) {
            return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR({ message: e }, res)
        }
    }
}