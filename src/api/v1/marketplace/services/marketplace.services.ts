import axios, { AxiosRequestConfig } from 'axios'
import { USER_AGENT, LOCAL_DATA_FOLDER_PATH, LOCAL_SLUGS_FOLDER_PATH, BLOCKDAEMON_API_KEY, NFTPORT_API_KEY } from '../../../../config'
import fs from 'fs'
import path from 'path'
import { OpenseaScraperServices } from '../services/OpenseaScraper.services.js'
import shuffleArray from 'shuffle-array'

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
                    name: data.collection.name?.toString(),
                    description: data.collection.description?.toString(),
                    imageUrl: data.collection.image_url?.toString(),
                    bannerUrl: data.collection.banner_image_url?.toString(),
                    contractAddress: data.collection.primary_asset_contracts[0]?.address?.toString(),
                    totalSupply: data.collection.stats?.total_supply?.toString(),
                    owners: data.collection.stats?.num_owners?.toString(),
                    floorPrice: data.collection.stats?.floor_price?.toString(),
                    oneDayChange: data.collection.stats?.one_day_change?.toString(),
                    totalVolume: data.collection.stats?.total_volume?.toString(),
                    twitter: data.collection.twitter_username?.toString(),
                    externalUrl: data.collection.external_url?.toString()
                }
                return json
            })
            .catch(function (error) {
                console.log(error);
                throw error
            });

        return result
    }

    static getTopTwentyCollectionNFTsFromSlug = async (slug: string) => {
        let resp = await OpenseaScraperServices.scrapeTopTwentyOffers(slug);
        return resp;
    }

    static getNextCollectionNFTsFromSlug = async (slug: string, offset: number) => {
        let resp = await OpenseaScraperServices.scrapeNextOffers(slug, offset);
        return resp;
    }

    static getCollectionNFTsFromSlugService = async (slug: string, limit: number) => {
        let corsURL = "https://cors.renderverse.workers.dev/?u="
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
                for (let item of data) {
                    let lastPrice = ((item.last_sale?.total_price ?? 0) / 10 ** 18)?.toString()
                    if (lastPrice != "0") {
                        var json = {
                            name: item.name?.toString() || slug + " #" + item.token_id,
                            imageUrl: item.image_url?.toString(),
                            lastPrice: ((item.last_sale?.total_price ?? 0) / 10 ** 18)?.toString(),
                            contract: item.asset_contract.address?.toString(),
                            tokenId: item.token_id?.toString()
                        }
                        results.push(json)
                    }
                }
                return results;
            })
            .catch(function (error) {
                console.log(error);
                throw error
            });
        return result
    }

    static getCollectionNFTsFromSymbolService = async (symbol: string, limit: number) => {
        let corsURL = "https://cors.renderverse.workers.dev/?u="
        let url = encodeURIComponent("https://api-mainnet.magiceden.dev/v2/collections/" + symbol + "/activities?offset=0&limit=" + limit)
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
                const data = JSON.parse(JSON.stringify(response.data));
                for (let i = 0; i < limit; i++) {
                    var json = {
                        name: data[i].collection?.toString(),
                        imageUrl: data[i].image?.toString(),
                        lastPrice: data[i].price?.toString(),
                        contract: data[i].tokenMint?.toString()
                    }
                    results.push(json)
                }
                return results;
            })
            .catch(function (error) {
                console.log(error);
                throw error
            });

        return result
    }

    static convertJSONToStringValues = async (json: object) => {
        const text = JSON.stringify(json)
        const newObj = text.replace(/:([^"[{][0-9A-Za-z]*)([,\]\}]?)/g, ':\"$1\"$2').replace('"/"', "/")
        try {
            const newJson = JSON.parse(newObj)
            return newJson
        }
        catch (e) {
            console.log(e)
            console.log(newObj)
            return
        }
    }

    static getNFTListingsService = async (contract: string, token_id: string) => {
        let corsURL = "https://cors.renderverse.workers.dev/?u="
        let url = encodeURIComponent("https://api.opensea.io/api/v1/asset/" + contract + "/" + token_id + "/listings")
        var config = {
            method: 'get',
            url: corsURL + url,
            headers: {
                'User-Agent': USER_AGENT
            }
        };
        const result = await axios(config)
            .then(async function (response) {
                //TODO - Return more info from listings and also return offers
                const price = ((JSON.parse(JSON.stringify(response.data)).seaport_listings[0]?.current_price ?? 0) / 10 ** 18)?.toString();
                return price
            })
            .catch(function (error) {
                console.log(error);
                throw error
            });

        return result
    }

    static getNFTFromContractService = async (contract: string, token_id: string) => {
        let corsURL = "https://cors.renderverse.workers.dev/?u="
        let url = encodeURIComponent("https://api.opensea.io/api/v1/asset/" + contract + "/" + token_id)
        var config = {
            method: 'get',
            url: corsURL + url,
            headers: {
                'User-Agent': USER_AGENT
            }
        };

        const result = await axios(config)
            .then(async function (response) {
                const data = JSON.parse(JSON.stringify(response.data));
                const json = {
                    collectionName: data.collection.name?.toString(),
                    collectionSlug: data.collection.slug?.toString(),
                    collectionImageUrl: data.collection.image_url?.toString(),
                    description: data.collection.description?.toString(),
                    name: data.name?.toString(),
                    imageUrl: data.image_url?.toString(),
                    lastPrice: ((data.last_sale?.total_price ?? 0) / 10 ** 18)?.toString(),
                    openSeaUrl: data.permalink?.toString(),
                    externalUrl: data.external_link?.toString(),
                    numSales: data.num_sales?.toString(),
                    totalSupply: data.collection.stats.total_supply?.toString(),
                    traits: await MarketplaceServices.convertJSONToStringValues(data.traits),
                    creator: await MarketplaceServices.convertJSONToStringValues(data.creator),
                    owner: await MarketplaceServices.convertJSONToStringValues(data.owner)
                }
                return json
            })
            .catch(function (error) {
                console.log(error);
                throw error
            });

        return result
    }

    static getNFTFromTokenMintService = async (contract: string) => {
        let url = "https://api-mainnet.magiceden.dev/v2/tokens/" + contract
        var config = {
            method: 'get',
            url: url,
            headers: {
                'User-Agent': USER_AGENT
            }
        };

        return await axios(config)
            .then(async function (response) {
                var data = JSON.parse(JSON.stringify(response.data));
                var json = {
                    collectionName: data.collection?.toString(),
                    name: data.name?.toString(),
                    imageUrl: data.image?.toString(),
                    traits: await MarketplaceServices.convertJSONToStringValues(data.attributes),
                    creator: await MarketplaceServices.convertJSONToStringValues(data.properties.creators),
                    owner: await MarketplaceServices.convertJSONToStringValues(data.owner)
                }
                return json
            })
            .catch(function (error) {
                console.log(error);
                throw error
            });

    }

    static getTrendingCollectionData = async (category: string, chain: string, count: number) => {
        try {
            let url = "https://opensea.io/rankings?sortBy=one_day_volume"
            if (category != null && category != '') {
                url = url + "&category=" + category
            }
            if (chain != null && chain != '') {
                url = url + "&chain=" + chain
            }
            const collectionDataFileName = "latestCollectionInfo.txt"
            const collectionDataFilePath = path.join(LOCAL_DATA_FOLDER_PATH, collectionDataFileName)
            const src = fs.readFileSync(collectionDataFilePath)?.toString();
            if (src != null && src != undefined) {
                const data = JSON.parse(src)
                const results: any = []
                for (let item of data) {
                    if (item.url == url) {
                        const slugs = item.items
                        for (let slug of slugs) {
                            var json = {
                                name: slug.name?.toString(),
                                logo: slug.logo?.toString(),
                                slug: slug.slug?.toString(),
                                numOwners: slug.numOwners?.toString(),
                                oneDayChange: slug.oneDayChange?.toString(),
                                oneDayVolume: slug.oneDayVolume?.toString(),
                                sevenDayChange: slug.sevenDayChange?.toString(),
                                sevenDayVolume: slug.sevenDayVolume?.toString(),
                                thirtyDayChange: slug.thirtyDayChange?.toString(),
                                thirtyDayVolume: slug.thirtyDayVolume?.toString(),
                            }
                            results.push(json)
                            if (results.length == count)
                                break;
                        }
                        break;
                    }
                }
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

    static getEthereumShowcaseNFTsService = async (limit: number) => {
        try {
            const showcaseSlugsFileName = "showcaseslugs.txt"
            const showcaseSlugsFilePath = path.join(LOCAL_SLUGS_FOLDER_PATH, showcaseSlugsFileName)
            var fs = require('fs');
            var slugs = fs.readFileSync(showcaseSlugsFilePath)?.toString().split("\n");
            let i = 0
            let j = 0
            slugs = shuffleArray(slugs)
            const results: any = []
            while (i < limit) {
                var slug = slugs[j];
                const nfts = (await this.getCollectionNFTsFromSlugService(slug.trim(), 10)).slice(3)
                for (let nft of nfts) {
                    results.push(nft)
                    i += 1;
                }
                j += 1;
            }
            return results;
        } catch (e) {
            console.log("error occured in updating the collection " + e)
            throw e
        }
    }

    static getSolanaShowcaseNFTsService = async (limit: number) => {
        try {
            const solanaSymbolsFileName = "solanasymbols.txt"
            const solanaSymbolsFilePath = path.join(LOCAL_SLUGS_FOLDER_PATH, solanaSymbolsFileName)
            var fs = require('fs');
            var symbols = fs.readFileSync(solanaSymbolsFilePath)?.toString().split("\n");
            let i = 0
            let j = 0
            const results: any = []
            while (i < limit) {
                var symbol = symbols[j];
                j += 1;
                const nfts = await this.getCollectionNFTsFromSymbolService(symbol.trim(), 2)
                for (let nft of nfts) {
                    results.push(nft)
                    i = i + 1
                }
            }
            return results;
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
            var slugs = fs.readFileSync(notableSlugsFilePath)?.toString().split("\n").sort(() => 0.5 - Math.random()).slice(0, limit);
            const results: any = []
            for (let i = 0; i < slugs.length; i++) {
                const info = await this.getCollectionInfoFromSlugService(slugs[i].trim())
                const json = {
                    name: info.name?.toString(),
                    bannerUrl: info.bannerUrl?.toString(),
                    imageUrl: info.imageUrl?.toString(),
                    oneDayChange: info.oneDayChange?.toString(),
                    slug: slugs[i].trim()?.toString()
                }
                results.push(json)
            }
            return results
        } catch (e) {
            console.log("error occured in updating the collection " + e)
            throw e
        }
    }

    static getCollectionInfoFromContractService = async (contract: string) => {
        let corsURL = "https://cors.renderverse.workers.dev/?u="
        let url = encodeURIComponent("https://api.opensea.io/api/v1/asset_contract/" + contract)
        var config = {
            method: 'get',
            url: corsURL + url,
            headers: {
                'User-Agent': USER_AGENT
            }
        };

        const result = await axios(config)
            .then(function (response) {
                const data = JSON.parse(JSON.stringify(response.data));
                const json = {
                    name: data.name?.toString(),
                    bannerUrl: data.collection.banner_image_url?.toString(),
                    imageUrl: data.collection.image_url?.toString(),
                    slug: data.collection.slug?.toString()
                }
                return json
            })
            .catch(function (error) {
                console.log(error);
                throw error
            });

        return result
    }

    static searchCollectionsService = async (searchstr: string, limit: number) => {

        let url = 'https://ubiquity.api.blockdaemon.com/v1/nft/ethereum/mainnet/collections/search?name=' + searchstr + '&verified=true'
        let authHeader = 'bearer ' + BLOCKDAEMON_API_KEY
        var config = {
            method: 'get',
            url: url,
            headers: {
                'Authorization': 'Bearer bd1bCmJFNLnGL5XA9LNI1g4gTjF742JyN2nuDgc6fLlcf0H'
            }
        };

        const result = await axios(config)
            .then(async (response) => {
                const contracts: any = []
                const results: any = []
                const data = JSON.parse(JSON.stringify(response.data)).data;
                for (let item of data) {
                    contracts.push(item.contracts[0])
                    if (contracts.length == limit) break;
                }
                for (let contract of contracts) {
                    let info = await this.getCollectionInfoFromContractService(contract)
                    results.push(info)
                }
                return results
            })
            .catch(function (error) {
                console.log(error);
            });
        return result
    }

    static searchNFTService = async (searchstr: string, limit: number) => {
        let url = "https://api.nftport.xyz/v0/search?text=" + searchstr + "&chain=ethereum&page_number=1&page_size=" + limit + "&order_by=mint_date&sort_order=desc"
        var config = {
            method: 'get',
            url: url,
            headers: {
                'Accept': 'application/json',
                'Authorization': NFTPORT_API_KEY || ""
            }
        };

        const result = await axios(config)
            .then(async (response) => {
                const contracts: any = []
                const results: any = []
                const data = JSON.parse(JSON.stringify(response.data)).search_results;
                for (let item of data) {
                    var info = {
                        name: item.name?.toString(),
                        imageUrl: item.cached_file_url?.toString(),
                        contract: item.contract_address?.toString(),
                        tokenId: item.token_id?.toString()
                    }
                    results.push(info)
                }
                return results
            })
            .catch(function (error) {
                console.log(error);
            });
        return result
    }

    static getNFTOffersService = async (contract: string, token_id: string) => {
    }
}

