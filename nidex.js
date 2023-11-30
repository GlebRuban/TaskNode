const puppeteer = require('puppeteer');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');

const scrapeDnsShop = async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.setRequestInterception(true);
  page.on('request', (request) => {
    if (
      ['image', 'stylesheet', 'font', 'script'].indexOf(request.resourceType()) !== -1 ||
      request.url().startsWith('https://www.google-analytics.com/')
    ) {
      request.abort();
    } else {
      request.continue();
    }
  });

  await page.goto('https://www.dns-shop.ru/catalog/17a8d26216404e77/vstraivaemye-xolodilniki/', {
    waitUntil: 'networkidle0',
  });

  const products = await page.evaluate(() => {
    const productList = Array.from(document.querySelectorAll('.catalog-product')).map(() => {
      for ( const element of productList) {
        const title = element.querySelector('.catalog-product__name a').textContent.trim();
        const price = element.querySelector('.product-buy .product-buy__price ').textContent.trim();
        if (title && price) {
          productList.push({
            name: title.innerText.trim(),
            price: price.innerText.trim(),
          });
        }
      }
    });
    return productList;
  });

  await browser.close();
  return products;
};

const saveToCsv = (products) => {
  const csvWriter = createCsvWriter({
    path: 'products.csv',
    header: [
      { id: 'title', title: 'Title' },
      { id: 'price', title: 'Price' },
    ],
  });
  

  csvWriter.writeRecords(products).then(() => {
    console.log('CSV file has been saved.');
  });
};

const csv = scrapeDnsShop().then((products) => {
  const csvData =  csv.toString();
  fs.writeFileSync('products.csv', csvData);
  saveToCsv(products);
});