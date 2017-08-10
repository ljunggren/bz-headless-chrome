const CDP = require('chrome-remote-interface');
const chromeLauncher = require('chrome-launcher');
 
/**
 * Launches a debugging instance of Chrome.
 * @param {boolean=} headless True (default) launches Chrome in headless mode.
 *     False launches a full version of Chrome.
 * @return {Promise<ChromeLauncher>}
 */
function launchChrome(headless=true) {
  return chromeLauncher.launch({
    // port: 9222, // Uncomment to force a specific port of your choice.
    chromeFlags: [
      '--disable-gpu',
      headless ? '--headless' : ''
    ]
  });
}

(async function() {

const chrome = await launchChrome();
const protocol = await CDP({port: chrome.port});

// Extract the DevTools protocol domains we need and enable them.
// See API docs: https://chromedevtools.github.io/devtools-protocol/
const {Page, Runtime} = protocol;
await Page.enable();
await Runtime.enable();

Page.navigate({url: 'http://localhost:8000/ci/headlesstest.html'});

// Wait for window.onload before doing stuff.
Page.loadEventFired(async () => {
  console.log('Page loading');
});


var fs = require('fs');

Runtime.consoleAPICalled(function(params) {
    // Not working when I open Chrome devtools.
    var logstring = params.args[0].value;
    console.log('Runtime.consoleAPICalled', logstring);

    if (logstring.includes("All tests completed!")) {
      fs.writeFile("report.html", logstring, function(err) {
        if(err) {
          return console.log(err);
        }
          console.log("The report was saved!");
        }); 
       protocol.close();
       chrome.kill(); // Kill Chrome.
    }
   
});



})();
