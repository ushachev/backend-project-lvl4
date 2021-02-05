import cheerio from 'cheerio';

export default (content) => {
  const $ = cheerio.load(content);
  return $('tbody tr td:first-of-type')
    .map((i, el) => Number($(el).text()))
    .get();
};
