import React from 'react';
import { render } from 'react-dom';
import { Router, Link, browserHistory } from 'react-router';

const Root = ({ children }) => (
  <div>
    <h1>React Router example</h1>

    <Link to="/first-page">First page</Link><br />
    <Link to="/second-page">Second page</Link>

    {children}
  </div>
);

const routes = {
  path: '/',
  component: Root,
  childRoutes: [
    {
      path: 'first-page',

      async getComponent(location, cb) {
        import FirstPage from '/imports/FirstPage.jsx';
        cb(null, FirstPage);
      }
    },
    {
      path: 'second-page',

      async getComponent(location, cb) {
        import SecondPage from '/imports/SecondPage.jsx';
        cb(null, SecondPage);
      }
    }
  ]
};

Meteor.startup(() => {
  render(
    <Router routes={routes} history={browserHistory} />,
    document.getElementById('root')
  );
});
