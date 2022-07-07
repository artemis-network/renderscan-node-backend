import { Request, Response } from 'express';
import { HttpFactory } from '../../http/http_factory';
import { MarketplaceServices } from '../services/marketplace.services'

export class MarketplaceController {


    static getTrendingCollections = async (req: Request, res: Response) => {

        const { category, chain, count } = req.body
        try {
            const resp = await MarketplaceServices.scrapeTrendingCollectionsService(category, chain, count)

            if (resp != null && resp != undefined) {
                console.log("Received trending collections")
                return HttpFactory.STATUS_200_OK({ collections: resp }, res)

            }
            else {
                return HttpFactory.STATUS_200_OK({ Info: "Response is empty from service" }, res)
            }

        } catch (e) {
            return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR({ message: e }, res)
        }
    }

    static getCollectionInfoFromSlug = async (req: Request, res: Response) => {
        const { slug } = req.body
        try {
            const resp = await MarketplaceServices.getCollectionInfoFromSlugService(slug)

            if (resp != null && resp != undefined) {
                console.log("Received collection info from slug")
                return HttpFactory.STATUS_200_OK({ CollectionInfo: resp }, res)

            }
            else {
                return HttpFactory.STATUS_200_OK({ Info: "Response is empty from service" }, res)
            }

        } catch (e) {
            return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR({ message: e }, res)
        }
    }

    static getCollectionNFTsFromSlug = async (req: Request, res: Response) => {
        const { slug, limit } = req.body
        try {
            const resp = await MarketplaceServices.getCollectionNFTsFromSlugService(slug, limit)

            if (resp != null && resp != undefined) {
                console.log("Received collection nfts from slug")
                return HttpFactory.STATUS_200_OK({ CollectionNFTs: resp }, res)

            }
            else {
                return HttpFactory.STATUS_200_OK({ Info: "Response is empty from service" }, res)
            }

        } catch (e) {
            return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR({ message: e }, res)
        }
    }

}