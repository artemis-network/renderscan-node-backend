const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

// load helper function to detect stealth plugin
const isUsingStealthPlugin = (browserInstance) => {
  return (browserInstance._process?.spawnargs || []).includes(
    "--disable-blink-features=AutomationControlled"
  );
};
const warnIfNotUsingStealth = (browserInstance) => {
  if (!browserInstance) {
    throw new Error("No or invalid browser instance provided.");
  }
  if (!isUsingStealthPlugin(browserInstance)) {
    console.warn(
      "🚧 WARNING: You are using puppeteer without the stealth plugin. You most likely need to use stealth plugin to scrape Opensea."
    );
  }
};

const getOffers = async (slug, optionsGiven = {}) => {
  const url = `https://opensea.io/collection/${slug}`;
  return await offersByUrl(url, optionsGiven);
};

const offersByUrl = async (url, optionsGiven = {}) => {
  const optionsDefault = {
    debug: false,
    prod: true,
  };
  const options = { ...optionsDefault, ...optionsGiven };
  const { debug, prod } = options;

  console.log(`=== scraping started ===\nScraping Opensea URL: ${url}`);

  // init browser
  let browser;
  if (prod) {
    browser = await puppeteer.launch({
      headless: !debug, // when debug is true => headless should be false
      args: ["--start-maximized","--no-sandbox"],
      executablePath: "/usr/bin/google-chrome",
      'ignoreHTTPSErrors': true
    });
  } else {
    browser = await puppeteer.launch({
      headless: !debug, // when debug is true => headless should be false
      args: ["--start-maximized","--no-sandbox"],
      'ignoreHTTPSErrors': true
    });
  }
  warnIfNotUsingStealth(browser);

  const page = await browser.newPage();
  await page.goto(url, {waitUntil: 'load', timeout: 0});

  await page.waitForSelector(".cf-browser-verification", { hidden: true });

  const html = await page.content();
  const __wired__ = _parseWiredVariable(html);

  console.log("closing browser...");
  await browser.close();

  return {
    offers: _extractOffers(__wired__),
    stats: _extractStats(__wired__),
  };
};

function _parseWiredVariable(html) {
  const str = html.split("window.__wired__=")[1].split("</script>")[0];
  return JSON.parse(str);
}

function _extractStats(__wired__) {
  try {
    return {
      totalOffers: Object.values(__wired__.records).find((o) => o.totalCount)
        .totalCount,
    };
  } catch (err) {
    return "stats not availible. Report issue if you think this is a bug: https://github.com/dcts/opensea-scraper/issues/new";
  }
}
function _extractOffers(__wired__) {
  const currencyDict = {};
  Object.values(__wired__.records)
    .filter((o) => o.__typename === "AssetType")
    .filter((o) => o.usdSpotPrice)
    .forEach((currency) => {
      currencyDict[currency.id] = {
        id: currency.id,
        symbol: currency.symbol,
        imageUrl: currency.imageUrl,
        usdSpotPrice: currency.usdSpotPrice,
      };
    });

  const assetContractDict = {};
  Object.values(__wired__.records)
    .filter((o) => o.__typename === "AssetContractType" && o.address)
    .forEach((o) => {
      assetContractDict[o.id] = o.address;
    });

  const floorPrices = Object.values(__wired__.records)
    .filter((o) => o.__typename === "PriceType" && o.eth && o.unit && o.usd)
    .filter((o) => o.eth)
    .map((o) => {
      return {
        amount: o.eth,
        currency: "ETH",
      };
    });

  const offers = Object.values(__wired__.records)
    .filter((o) => o.__typename === "AssetType" && o.tokenId)
    .map((o) => {
      const assetContract = _extractAssetContract(o, assetContractDict);
      const tokenId = o.tokenId;
      const contractAndTokenIdExist =
        Boolean(assetContract) && Boolean(tokenId);
      return {
        name: o.name,
        tokenId: tokenId,
        displayImageUrl: o.displayImageUrl,
        assetContract: assetContract,
        offerUrl: contractAndTokenIdExist
          ? `https://opensea.io/assets/${assetContract}/${tokenId}`
          : undefined,
      };
    });

  floorPrices.forEach((floorPrice, indx) => {
    offers[indx].floorPrice = floorPrice;
  });

  return offers;
}

function _extractAssetContract(offerObj, assetContractDict) {
  try {
    return assetContractDict[offerObj.assetContract.__ref];
  } catch (err) {
    return undefined;
  }
}

module.exports = {
  getOffers,
};
