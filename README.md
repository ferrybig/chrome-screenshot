# chrome-screenshot
Example how to make a screenshot of a page using the chrome dev tools

## Usage

Start a chrominium based browser with the following command (may require the full path to the chrome instance):

    chrome.exe  --user-data-dir="/tmp/gtest" --remote-debugging-port=9222 --app="http://ferrybig.me" --headless
    
Or on Windows:

    chrome.exe  --user-data-dir=%TEMP%\gtest --remote-debugging-port=9222 --app="http://ferrybig.me"

Notice that it actually requires a new instance of Chrome to accept the commandline flag

After the above steps are complete, run the program:

    node main.js http://example.com/
