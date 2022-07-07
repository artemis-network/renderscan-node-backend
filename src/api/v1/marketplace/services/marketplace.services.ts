import axios, { AxiosRequestConfig } from 'axios'
import puppeteer from 'puppeteer'
import { USER_AGENT } from '../../../../config'

export class MarketplaceServices {

    static scrapeTrendingCollectionsService = async (category: string, chain: string, count: number) => {
        try {
            let url = "https://opensea.io/rankings?sortBy=seven_day_volume"
            if (category != null && category != '') {
                url = url + "&category=" + category
            }
            if (chain != null && chain != '') {
                url = url + "&chain=" + chain
            }
            const browser = await puppeteer.launch({
                headless: true,
                args: ["--disable-setuid-sandbox"],
                'ignoreHTTPSErrors': true
            });
            const page = await browser.newPage()
            await page.setUserAgent(USER_AGENT)
            await page.goto(url)
            const scriptHtml = await page.$eval('#__NEXT_DATA__', element => element.innerHTML);

            if (scriptHtml != null && scriptHtml != undefined) {
                const data = JSON.parse(scriptHtml).props.relayCache[0][1].json.data.rankings.edges
                const results: any = []
                data.some(function (item: any) {
                    var json = {
                        name: item.node.name,
                        logo: item.node.logo,
                        slug: item.node.slug,
                        floor: item.node.statsV2.floorPrice?.eth,
                        numOwners: item.node.statsV2.numOwners,
                        oneDayChange: item.node.statsV2.oneDayChange,
                        oneDayVolume: item.node.statsV2.oneDayVolume.unit,
                        sevenDayChange: item.node.statsV2.sevenDayChange,
                        sevenDayVolume: item.node.statsV2.sevenDayVolume.unit,
                        thirtyDayChange: item.node.statsV2.thirtyDayChange,
                        thirtyDayVolume: item.node.statsV2.thirtyDayVolume.unit,
                    }
                    results.push(json)
                    if (results.length == count)
                        return true
                })
                await browser.close()
                return results;
            }
            else {
                console.log("HTML is EMPTY, may be ACCESS DENIED")
                return
            }

        } catch (err) {
            console.log("Could not create a browser instance => : ", err);
            throw err
        }

    }

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
                    contractAddress: data.collection.primary_asset_contracts[0].address,
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
        let url = encodeURIComponent("https://api.opensea.io/api/v1/assets?collection_slug=" + slug + "&limit=" + limit)
        var config = {
            method: 'get',
            url: corsURL + url,
            headers: { 
                'User-Agent': USER_AGENT
              }
        };

        const result = await axios(config)
            .then(function (response) {
                const results:any = []
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
}