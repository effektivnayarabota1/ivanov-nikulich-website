import Page from "../models/page.js";
import File from "./config/file.js";

export default class BlockController {
  static async index(req, res) {
    const { pageID, blockID } = req.params;

    const page = await Page.findById(pageID);
    const block = await page.blocks.find((block) => {
      return block._id.toString() == blockID;
    });
    await block.elements.sort((a, b) => {
      return a.position - b.position;
    });

    await res.render("admin/block", { pageID: page.id, block });
  }

  static async create(req, res) {
    const { pageID, type } = req.params;

    const page = await Page.findById(pageID);
    await page.blocks.push({ type, elements: {} });

    await page.save();
    await res.send("OK");
  }

  static async remove(req, res) {
    const pageID = req.params.pageID;
    const blockID = req.params.blockID;

    try {
      const page = await Page.findById(pageID);
      const block = page.blocks.id(blockID);
      await block.remove();
      await File.remove(pageID, blockID);
      await page.save();
      await res.send("OK");
    } catch (err) {
      await res.send(err);
    }

    // const page = await Page.findOne({ slug: pageSlug });
    // const pageDir = `${__dirname}/uploads/${pageSlug}/`;
    // await page.remove();
    // await fsPromises.rm(pageDir, {
    //   force: true,
    //   recursive: true,
    // });
    // await res.redirect(303, "/admin");
  }

  static async save(req, res) {
    const { pageID, blockID, elementID } = req.params;
    const page = await Page.findById(pageID);
    const block = await page.blocks.id(blockID);
    const { elements } = block;

    block.type = req.body.type;
    await this.rewrite(elements, req.body, req.files);

    await page.save();

    await res.send("OK");
  }

  static async rewrite(elements, body, files) {
    await files.forEach(async (file, index) => {
      const { mimetype, filename, size } = file;

      const element = await elements.find((element) => {
        return element._id.toString() == filename;
      });
      element.position = index;
      element.title = body.title[index];
      element.desc = body.desc[index];

      if (size > 0 && mimetype != "application/octet-stream") {
        element.img = await File.write(file);
      }
    });
  }

  // static async editor(req, res) {
  //   const pageSlug = req.params.pageSlug;
  //   const blockSlug = req.params.blockSlug;
  //
  //   const page = await Page.findOne({ slug: pageSlug });
  //   const block = page.blocks.find((block) => block.slug === blockSlug);
  //   const blockType = block.type;
  //   const blockElems = block.elements;
  //
  //   await res.render("admin/block", {
  //     pageSlug,
  //     blockSlug,
  //     blockType,
  //     blockElems,
  //   });
  // }
  //
  // static async update(req, res) {
  //   const pageSlug = req.params.pageSlug;
  //   const blockSlug = req.params.blockSlug;
  //   const blockType = req.body.blockType;
  //
  //   let page = await Page.findOne({ slug: pageSlug });
  //   let block = page.blocks.find((block) => block.slug === blockSlug);
  //   let elements = block.elements;
  //   block.type = blockType;
  //
  //   let reqBody = [];
  //   if (!Array.isArray(req.body.desc)) {
  //     req.body.desc = [req.body.desc];
  //   }
  //   if (!Array.isArray(req.body["element-slug"])) {
  //     req.body["element-slug"] = [req.body["element-slug"]];
  //   }
  //   req.body["element-slug"].forEach(async (elemSlug, index) => {
  //     reqBody.push({ slug: elemSlug, desc: req.body.desc[index] });
  //   });
  //
  //   for (let file of req.files) {
  //     const element = reqBody.find((element) => element.slug === file.filename);
  //     element.img = {
  //       data: fs.readFileSync(
  //         path.join(
  //           `${__dirname}/uploads/${pageSlug}/${blockSlug}/${file.filename}`
  //         )
  //       ),
  //       contentType: file.mimetype,
  //     };
  //   }
  //
  //   let outputElems = [];
  //   for (let reqElem of reqBody) {
  //     const reqElemSlug = reqElem.slug;
  //
  //     const dbElem = await elements.find(
  //       (element) => element.slug === reqElemSlug
  //     );
  //     if (!!dbElem) {
  //       if (!!dbElem.img && !reqElem.img) reqElem.img = dbElem.img;
  //     }
  //     outputElems.push(reqElem);
  //   }
  //
  //   block.elements = outputElems;
  //
  //   await page.save();
  //   await res.redirect(303, `/admin/${pageSlug}`);
  // }
  //
  // static async delete(req, res) {
  //   const pageSlug = req.params.pageSlug;
  //   const blockSlug = req.params.blockSlug;
  //
  //   let page = await Page.findOne({ slug: pageSlug });
  //   const block = await page.blocks.find((block) => block.slug === blockSlug);
  //   // page.blocks = await page.blocks.filter((block) => block.slug !== blockSlug);
  //   await block.remove();
  //
  //   const dir = `${__dirname}/uploads/${pageSlug}/${blockSlug}/`;
  //   if (fs.existsSync(dir)) {
  //     await fsPromises.rm(dir, {
  //       force: true,
  //       recursive: true,
  //     });
  //   }
  //
  //   await page.save();
  //   await res.redirect(303, `/admin/${pageSlug}`);
  // }
}
