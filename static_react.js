/* jshint esversion:6 */

var React = require('react');
var ReactDOMServer = require('react-dom/server');

import Main from './src/components/Main';

let main = React.createElement(Main);

export default {
    content: ReactDOMServer.renderToString(main)
};
