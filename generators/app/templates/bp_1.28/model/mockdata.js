var fs = require('fs')
var path = require('path')
var mocker = require('mocker-data-generator')
/**
 * mock-data-generator: https://github.com/danibram/mocker-data-generator
 * fakerjs: https://github.com/Marak/faker.js
 * chancejs: https://github.com/victorquinn/chancejs
 * casual: https://github.com/boo1ean/casual
 * randomExpjs: https://github.com/fent/randexp.js
 */

// **************************************************
// begin of your mock data generation logic
// **************************************************
// here's some sample code, please replace them with your
// mock data generation logic

var example = {
  name: {
    function: function () {
      return this.faker.name.firstName() + ' ' + this.faker.name.lastName()
    }
  },
  age: {
    faker: 'random.number({min:20, max: 70})'
  }
}

mocker()
  .schema('exampleSet', example, 10)
// **************************************************
// end of your mock data generation logic
// **************************************************
  .build(function (data) {
    console.log(data)
    // generate faker data json files
    Object.keys(data).map(function (name) {
      fs.writeFile(path.resolve(__dirname, name + '.json'), JSON.stringify(data[name]))
      console.log(name + '.json is generated')
    })
  })
