import { render } from '@testing-library/react';

import FileUploader from './file-uploader';

describe('FileUploader', () => {
  
  it('should render successfully', () => {
    const { baseElement } = render(<FileUploader />);
    expect(baseElement).toBeTruthy();
  });
  
});
