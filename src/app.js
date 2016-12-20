var React = require('react');
var ReactDOM = require('react-dom');
var $ = require('jquery');

import Main from './components/Main';


$(document).ready(()=>{
    ReactDOM.render(<Main />,document.getElementById('content'));
});
