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

const getOffersByScrolling = async (slug, optionsGiven = {}) => {
  const url = `https://opensea.io/collection/${slug}`;
  return await offersByScrollingByUrl(url, 20, optionsGiven);
};

const offersByScrollingByUrl = async (
  url,
  resultSize = 100,
  optionsGiven = {}
) => {
  const beginTime = Date.now();
  const optionsDefault = {
    debug: false,
    prod: true,
  };
  const options = { ...optionsDefault, ...optionsGiven };
  const { debug, prod, offset } = options;
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
  await page.goto(url, { waitUntil: "load", timeout: 0 });

  await page.waitForSelector(".cf-browser-verification", { hidden: true });

  let offersFromGraphql = [];
  let responses = [];
  let responseErrors = [];

  if (offset > 0) {
    let offsetVar = offset;
    console.log("offset is more than 0");
    let bottomReached = await bottomOfPageReached(page);
    while (!bottomReached && offsetVar > 0) {
      console.log("current offset = " + offsetVar);
      console.log("scorlling....");
      await scrollToBottom(page);
      await page.waitForTimeout(1000);
      bottomReached = await bottomOfPageReached(page);
      offsetVar = offsetVar - 1;
    }
  }

  while (offersFromGraphql.length <= 0) {
    page.on("response", async (response) => {
      if (response.url().includes("graphql")) {
        responses.push(response);
        const offersBatch = await extractOffersFromGraphqlApiResponse(
          response,
          responseErrors
        );
        offersFromGraphql = offersFromGraphql.concat(offersBatch);
      }
    });
    let bottomReached = await bottomOfPageReached(page);
    if (!bottomReached) {
      await scrollToBottom(page);
      await page.waitForTimeout(5000);
    }
  }

  console.log("closing browser...");
  await browser.close();

  const endTime = Date.now();
  const offers = offersFromGraphql;
  // remove duplicates
  // const uniqOffers = x.offers.filter((v,i,s) => s.map(o => o.offerUrl).indexOf(v.offerUrl) === i).length;
  return {
    offers: offers,
    executionTime: Number((endTime - beginTime) / 1000), // measure performance in seconds
    responses: responses,
    responseErrors: responseErrors,
  };
};

const extractOffersFromGraphqlApiResponse = async (
  response,
  responseErrors
) => {
  const buf = await response.buffer();
  const data = JSON.parse(buf.toString());
  try {
    return data.data.query.search.edges.map((o) => {
      const assetContract = o.node.assetContract.address;
      const tokenId = o.node.tokenId;
      const contractAndTokenIdExist =
        Boolean(assetContract) && Boolean(tokenId);
      return {
        name: o.node.name,
        tokenId: tokenId,
        displayImageUrl: o.node.imageUrl,
        assetContract: assetContract,
        offerUrl: contractAndTokenIdExist
          ? `https://opensea.io/assets/${assetContract}/${tokenId}`
          : undefined,
        floorPrice: {
          amount: o.node.orderData.bestAskV2.priceType?.eth || "0",
          currency: "ETH",
        },
      };
    });
  } catch (err) {
    console.log(err);
    responseErrors.push(response);
    return [];
  }
};

async function bottomOfPageReached(page) {
  return await page.evaluate(() => {
    const bottomNotReached =
      document.scrollingElement.scrollTop + window.innerHeight <
      document.scrollingElement.scrollHeight;
    return !bottomNotReached;
  });
}
async function scrollToBottom(page) {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
}

module.exports = {
  getOffersByScrolling,
};
