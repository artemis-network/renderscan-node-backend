import axios, { AxiosRequestConfig } from 'axios'
import puppeteer from 'puppeteer'
import { USER_AGENT, LOCAL_DATA_FOLDER_PATH, LOCAL_SLUGS_FOLDER_PATH } from '../../../../config'
import fs from 'fs'
import path from 'path'

export class MarketplaceServices {

    static getCollectionInfoFromSlugService = async (slug: string) => {
        let url = "https://api.opensea.io/api/v1/collection/" + slug
        var config = {
            method: 'get',
            url: url,
            headers: {
                'User-Agent': USER_AGENT
            }
        };

        const result = await axios(config)
            .then(function (response) {
                const data = JSON.parse(JSON.stringify(response.data));
                const json = {
                    name: data.collection.name,
                    description: data.collection.description,
                    imageUrl: data.collection.image_url,
                    bannerUrl: data.collection.banner_image_url,
                    contractAddress: data.collection.primary_asset_contracts[0]?.address,
                    stats: data.collection.stats,
                    twitter: data.collection.twitter_username,
                    externalUrl: data.collection.external_url
                }
                return json
            })
            .catch(function (error) {
                console.log(error);
                throw error
            });

        return result
    }

    static getCollectionNFTsFromSlugService = async (slug: string, limit: number) => {
        let corsURL = "https://cors.ryanking13.workers.dev/?u="
        let url = encodeURIComponent("https://api.opensea.io/api/v1/assets?collection_slug=" + slug + "&limit=" + limit + "&order_direction=asc")
        var config = {
            method: 'get',
            url: corsURL + url,
            headers: {
                'User-Agent': USER_AGENT
            }
        };

        const result = await axios(config)
            .then(function (response) {
                const results: any = []
                const data = JSON.parse(JSON.stringify(response.data)).assets;
                data.some(function (item: any) {
                    var json = {
                        name: item.name,
                        imageUrl: item.image_url,
                        externalUrl: item.external_link,
                        openseaUrl: item.permalink,
                        owner: item.owner,
                        creator: item.creator,
                        traits: item.traits,
                        tokenId: item.token_id
                    }
                    results.push(json)
                })
                return results;
            })
            .catch(function (error) {
                console.log(error);
                throw error
            });

        return result
    }

    static getTrendingCollectionData = async (category: string, chain: string, count: number) => {
        try {
            let url = "https://opensea.io/rankings?sortBy=seven_day_volume"
            if (category != null && category != '') {
                url = url + "&category=" + category
            }
            if (chain != null && chain != '') {
                url = url + "&chain=" + chain
            }
            const collectionDataFileName = "latestCollectionInfo.txt"
            const collectionDataFilePath = path.join(LOCAL_DATA_FOLDER_PATH, collectionDataFileName)
            const src = fs.readFileSync(collectionDataFilePath).toString();
            if (src != null && src != undefined) {
                const data = JSON.parse(src)
                const results: any = []
                data.some(function (item: any) {
                    if (item.url == url) {
                        const slugs = item.items
                        slugs.forEach(function (slug: any) {
                            var json = {
                                name: slug.name,
                                logo: slug.logo,
                                slug: slug.slug,
                                numOwners: slug.numOwners,
                                oneDayChange: slug.oneDayChange,
                                oneDayVolume: slug.oneDayVolume.unit,
                                sevenDayChange: slug.sevenDayChange,
                                sevenDayVolume: slug.sevenDayVolume.unit,
                                thirtyDayChange: slug.thirtyDayChange,
                                thirtyDayVolume: slug.thirtyDayVolume.unit,
                            }
                            results.push(json)
                            if (results.length == count)
                                return true
                        })
                    }
                })
                return results;
            }
            else {
                console.log("File is EMPTY, may be not updated")
                return
            }
        } catch (e) {
            console.log("error occured in updating the collection " + e)
            throw e
        }
    }

    static updateTrendingCollectionData = async (inputFilePath: string) => {
        if (!fs.existsSync(LOCAL_DATA_FOLDER_PATH)) {
            fs.mkdirSync(LOCAL_DATA_FOLDER_PATH);
        }
        try {
            const collectionDataFileName = "latestCollectionInfo.txt"
            const collectionDataFilePath = path.join(LOCAL_DATA_FOLDER_PATH, collectionDataFileName)
            const src = fs.readFileSync(inputFilePath);
            fs.writeFileSync(collectionDataFilePath, src);
            fs.unlinkSync(inputFilePath)
            return true
        } catch (e) {
            console.log("error occured in updating the collection " + e)
            throw e
        }
    }

    static getShowcaseNFTsService = async (limit: number) => {
        try {
            const showcaseSlugsFileName = "showcaseslugs.txt"
            const showcaseSlugsFilePath = path.join(LOCAL_SLUGS_FOLDER_PATH, showcaseSlugsFileName)
            var fs = require('fs');
            var slugs = fs.readFileSync(showcaseSlugsFilePath).toString().split("\n");
            let i = 0
            const results: any = []
            while (i < limit) {
                var slug = slugs[Math.floor(Math.random() * slugs.length)];
                const nfts = await this.getCollectionNFTsFromSlugService(slug.trim(), 3)
                i = i + 3
                results.push(nfts)
            }
            return results
        } catch (e) {
            console.log("error occured in updating the collection " + e)
            throw e
        }
    }

    static getNotableCollectionService = async (limit: number) => {
        try {
            const notableSlugsFileName = "notablecollectionslugs.txt"
            const notableSlugsFilePath = path.join(LOCAL_SLUGS_FOLDER_PATH, notableSlugsFileName)
            var fs = require('fs');
            var slugs = fs.readFileSync(notableSlugsFilePath).toString().split("\n").sort(() => 0.5 - Math.random()).slice(0, limit);
            const results: any = []
            for (let i = 0; i < slugs.length; i++) {
                const info = await this.getCollectionInfoFromSlugService(slugs[i].trim())
                results.push(info)
            }
            return results
        } catch (e) {
            console.log("error occured in updating the collection " + e)
            throw e
        }
    }
}
