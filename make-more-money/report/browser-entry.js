import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { registerFonts, Magazine, buildModel } from './magazine.jsx';

async function toBlob(input) {
  var origin = (typeof location !== 'undefined' && location.origin) ? location.origin : '';
  registerFonts(origin + '/make-more-money/fonts');
  var model = buildModel(input);
  return pdf(React.createElement(Magazine, { model: model })).toBlob();
}

export { toBlob };
