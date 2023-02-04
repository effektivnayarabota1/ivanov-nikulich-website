import Page from "../models/page.js";
import Header from "../models/header.js";
import Footer from "../models/footer.js";

import path from "path";
import fs from "fs";
import fsPromises from "fs/promises";
import isEmpty from "../helpers/isEmpty.js";

const __dirname = path.resolve();

export default class PageController {
  static async index(req, res) {
    const pages = await Page.find({});
    const header = await Header.findOne({});
    const footer = await Footer.findOne({});
    await res.render("admin/index", {
      pages: pages,
      header: header,
      footer: footer,
    });
  }

  static async create(_req, res) {
    try {
      await Page.create({});
      await res.send("OK");
    } catch (err) {
      console.log(err);
      await res.send(err);
    }
  }

  static async update(req, res) {
    let pageSlug = req.params.slug;
    let page = await Page.findOne({ slug: pageSlug });
    page.title = req.body.title || "title";
    page.desc = req.body.desc;

    if (!!req.file) {
      page.img = {
        data: fs.readFileSync(
          path.join(`${__dirname}/uploads/${pageSlug}/${req.file.filename}`)
        ),
        contentType: req.file.mimetype,
      };
    }

    await page.save();

    if (pageSlug !== page.slug) {
      const oldPath = `${__dirname}/uploads/${pageSlug}/`;
      const newPath = `${__dirname}/uploads/${page.slug}/`;
      await fsPromises.rename(oldPath, newPath);

      if (!!req.file) {
        page.img = {
          data: fs.readFileSync(
            path.join(`${__dirname}/uploads/${page.slug}/${req.file.filename}`)
          ),
          contentType: req.file.mimetype,
        };
      }
    }

    page.save();

    await res.redirect("/admin");
  }

  static async delete(req, res) {
    const pageSlug = req.params.slug;
    const page = await Page.findOne({ slug: pageSlug });
    const pageDir = `${__dirname}/uploads/${pageSlug}/`;
    await page.remove();
    await fsPromises.rm(pageDir, {
      force: true,
      recursive: true,
    });

    await res.redirect(303, "/admin");
  }

  static async editor(req, res) {
    const slug = req.params.slug;
    const page = await Page.findOne({ slug: slug });

    await res.render("admin/page", {
      slug: slug,
      title: page.title,
      img: page.img,
      desc: page.desc,
      blocks: page.blocks,
    });
  }

  /* TODO Сервисный запрос. Избавиться от него. */
  static async clear(res) {
    Page.find({}, async (err, items) => {
      if (err) {
        console.log(err);
        res.status(500).send("An error occurred", err);
      } else {
        for (let item of items) {
          await Page.deleteOne({ pageId: item.pageId });
        }
        await fsPromises.rm(__dirname + "/uploads/", {
          force: true,
          recursive: true,
        });
      }
    });
  }

  static async clearAll(res) {
    // await ElementController.clear();
    // await BlockController.clear();
    await this.clear();
    await res.redirect("/admin");
  }
}
