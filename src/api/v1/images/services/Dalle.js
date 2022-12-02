const { Dalle } = require("dalle-node");

const dalle = new Dalle("sess-6gk02w8Ex6ExNYSZWdTgwSqUAJ0Hx1zPDJEJGDUr"); // Bearer Token

export class DalleServices {
  static generateImages = async (text) => {
    // const task = await dalle.getTask("task-Pa9maUtgxf8MHsOZsnLAp1u0");
    // console.log(task.generations.data[0].generation);
  };
}
