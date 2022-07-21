import axios, { AxiosRequestConfig } from 'axios'
import puppeteer from 'puppeteer'
import { USER_AGENT, LOCAL_DATA_FOLDER_PATH, LOCAL_SLUGS_FOLDER_PATH, BLOCKDAEMON_API_KEY, NFTPORT_API_KEY } from '../../../../config'
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
                    totalSupply: data.collection.stats?.total_supply,
                    owners: data.collection.stats?.num_owners,
                    floorPrice: data.collection.stats?.floor_price,
                    oneDayChange: data.collection.stats?.one_day_change,
                    totalVolume: data.collection.stats?.total_volume,
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
                        lastPrice: (item.last_sale?.total_price ?? 0) / 10 ** 18,
                        contract: item.asset_contract.address,
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

    static getCollectionNFTsFromSymbolService = async (symbol: string, limit: number) => {
        let url = "https://api-mainnet.magiceden.dev/v2/collections/" + symbol + "/activities?offset=0&limit=" + limit
        var config = {
            method: 'get',
            url: url,
            headers: {
                'User-Agent': USER_AGENT
            }
        };

        const result = await axios(config)
            .then(function (response) {
                const results: any = []
                const data = JSON.parse(JSON.stringify(response.data));
                data.forEach(function (item: any) {
                    var json = {
                        name: item.collection,
                        imageUrl: item.image,
                        lastPrice: item.price,
                        contract: item.tokenMint
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

    static getNFTFromContractService = async (contract: string, token_id: string) => {
        let corsURL = "https://cors.ryanking13.workers.dev/?u="
        let url = encodeURIComponent("https://api.opensea.io/api/v1/asset/" + contract + "/" + token_id)
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
                    collectionName: data.collection.name,
                    collectionSlug: data.collection.slug,
                    collectionImageUrl: data.collection.image_url,
                    description: data.collection.description,
                    name: data.name,
                    imageUrl: data.image_url,
                    lastPrice: (data.last_sale?.total_price ?? 0) / 10 ** 18,
                    openSeaUrl: data.permalink,
                    externalUrl: data.external_link,
                    numSales: data.num_sales,
                    traits: data.traits,
                    creator: data.creator,
                    owner: data.owner
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
            .then(function (response) {
                var data = JSON.parse(JSON.stringify(response.data));
                var json = {
                    collectionName: data.collection,
                    name: data.name,
                    imageUrl: data.image,
                    traits: data.attributes,
                    attributes: data.attributes,
                    creator: data.properties.creators,
                    owner: data.owner
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
            const src = fs.readFileSync(collectionDataFilePath).toString();
            if (src != null && src != undefined) {
                const data = JSON.parse(src)
                const results: any = []
                for (let item of data) {
                    if (item.url == url) {
                        const slugs = item.items
                        for (let slug of slugs) {
                            var json = {
                                name: slug.name,
                                logo: slug.logo,
                                slug: slug.slug,
                                numOwners: slug.numOwners,
                                oneDayChange: slug.oneDayChange,
                                oneDayVolume: slug.oneDayVolume,
                                sevenDayChange: slug.sevenDayChange,
                                sevenDayVolume: slug.sevenDayVolume,
                                thirtyDayChange: slug.thirtyDayChange,
                                thirtyDayVolume: slug.thirtyDayVolume,
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

    static getSolanaShowcaseNFTsService = async (limit: number) => {
        try {
            const solanaSymbolsFileName = "solanasymbols.txt"
            const solanaSymbolsFilePath = path.join(LOCAL_SLUGS_FOLDER_PATH, solanaSymbolsFileName)
            var fs = require('fs');
            var symbols = fs.readFileSync(solanaSymbolsFilePath).toString().split("\n");
            let i = 0
            const results: any = []
            while (i < limit) {
                var symbol = symbols[Math.floor(Math.random() * symbols.length)];
                const nfts = await this.getCollectionNFTsFromSymbolService(symbol.trim(), 3)
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
                const json = {
                    name: info.name,
                    bannerUrl: info.bannerUrl,
                    imageUrl: info.imageUrl,
                    oneDayChange: info.oneDayChange,
                    slug: slugs[i].trim()
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
        let corsURL = "https://cors.ryanking13.workers.dev/?u="
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
                    name: data.name,
                    bannerUrl: data.collection.banner_image_url,
                    imageUrl: data.collection.image_url,
                    slug: data.collection.slug
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
                        name: item.name,
                        imageUrl: item.cached_file_url,
                        contract: item.contract_address,
                        tokenId: item.token_id
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
}
