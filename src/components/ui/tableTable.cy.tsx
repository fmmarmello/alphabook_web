import React from 'react';
import { mount } from 'cypress/react';
import { Table } from './table';

describe('<Table />', () => {
  it('renders', () => {
    // see: https://on.cypress.io/mounting-react
    mount(<Table />);
  });
});
