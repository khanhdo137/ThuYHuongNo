// Centralized assistant avatar. Swap the require target to change the avatar image.
// To use your custom cat image, save it as: ThuYHuongNo/assets/images/assistant-cat.png
// and the module will reference it below.

// Note: if the file is not present, Metro will error on bundling. Add the image file
// to avoid runtime/bundler failures.
const avatar = require('../../assets/images/assistant-cat.png');

export default avatar;
