import { Request, Response } from 'express';
import { HttpFactory } from '../../http/http_factory';
import { MarketplaceServices } from '../services/marketplace.services'

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

    static getShowcaseNFTs = async (req: Request, res: Response) => {
        const { limit } = req.body
        try {
            const resp = await MarketplaceServices.getShowcaseNFTsService(limit)

            if (resp != null && resp != undefined) {
                console.log("Received collection nfts for showcase")
                return HttpFactory.STATUS_200_OK({ ShowcaseNFTs: resp }, res)

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


}