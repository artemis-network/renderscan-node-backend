const { getOffers } = require("../services/offers.js");
const { getOffersByScrolling } = require("../services/offersByScrolling.js");

export class OpenseaScraperServices {
  static scrapeTopTwentyOffers = async (slug) => {
    const options = {
      debug: false,
      prod: true,
    };
    const result = await getOffers(slug, options);
    //console.log(`total Offers: ${result.stats.totalOffers}`);
    //console.dir(result.offers, { depth: null });
    return result.offers;
  };

  static scrapeNextOffers = async (slug, offset) => {
    const options = {
      debug: false,
      prod: true,
      offset: offset,
    };
    const result = await getOffersByScrolling(slug, options);
    //console.log(`total time: ${result.executionTime}`);
    //console.dir(result.offers, { depth: null });
    return result.offers;
  };
}
