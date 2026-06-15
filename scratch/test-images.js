const fs = require('fs');
const cheerio = require('cheerio');
const html = fs.readFileSync('scratch/anphatpc_product.html', 'utf8');
const $ = cheerio.load(html);

const images = [];
$('img').each((i, el) => {
  const src = $(el).attr('src') || $(el).attr('data-src');
  if (src && (src.includes('product') || src.includes('upload'))) {
    images.push(src);
  }
});
console.log(images);
