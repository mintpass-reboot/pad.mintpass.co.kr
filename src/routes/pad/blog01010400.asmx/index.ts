import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import * as XMLBuilder from 'xmlbuilder2';
import { APIError, APIErrorType } from '../../../common/error';
import { prisma } from '../../..';
import { findOrCreateBlog, findOrRegisterUser } from '../../../common/mintpass';
import { User } from '@prisma/client';
import iconv from 'iconv-lite';
import { urlDecodeBytes } from '../../../common/utils';

enum MintPadBlogSearchEnum {
  SUBJECT = 'Subject',
  BLOGNAME = 'BlogName',
  NICKNAME = 'NickName',
  TAG = 'Tag',
}

export default function blogPlugin(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void) {
  app.get('/', (req, rep) => {
    const xml = XMLBuilder.create();

    xml.ele('info').ele('endpoint').txt('blog').up().up();

    rep.send(xml.end());
  });

  app.get('/GetMyInfo', async (req, rep) => {
    const { UId: uid } = req.query as Record<string, any>;
    if (!uid) throw new APIError(APIErrorType.INVALID_REQUEST);

    const user = await findOrRegisterUser(uid);
    const blog = await findOrCreateBlog(user);

    const xml = XMLBuilder.create();
    xml
      .ele('Blog')
      .ele('BlogIdx')
      .txt(blog.idx.toString())
      .up()
      .ele('BlogName')
      .txt(blog.name)
      .up()
      .ele('ImgfileName')
      .txt(blog.imgFile ?? '')
      .up()
      .ele('BloggerName')
      .txt(user.name)
      .up()
      .ele('BloggerNick')
      .txt(user.nick)
      .up()
      .up();

    rep.send(xml.end());
  });

  app.get('/GetBestBlogger', async (req, rep) => {
    const bestBlogs = await prisma.blog.findMany({
      where: {
        isBest: true,
      },
    });

    const xml = XMLBuilder.create();
    const bestBloggers = xml.ele('BestBloggers');
    await Promise.all(
      bestBlogs.map(async (n) => {
        const user = (await prisma.user.findUnique({ where: { id: n.ownerId } })) as User;
        bestBloggers
          .ele('Blogger')
          .ele('BloggerID')
          .txt(n.ownerId)
          .up()
          .ele('BlogName')
          .txt(n.name)
          .up()
          .ele('ImgfileName')
          .txt(n.imgFile ?? '')
          .up()
          .ele('BloggerName')
          .txt(user.name)
          .up()
          .ele('BloggerNick')
          .txt(user.nick)
          .up()
          .up();
      }),
    );

    rep.send(xml.end());
  });

  app.get('/GetBloggerID', async (req, rep) => {
    const { BlogIdx: blogIdx } = req.query as Record<string, any>;

    const blog = await prisma.blog.findUnique({
      where: {
        idx: blogIdx,
      },
    });

    const xml = XMLBuilder.create();
    xml
      .ele('string')
      .txt(blog?.ownerId ?? '')
      .up();
    rep.send(xml.end());
  });

  app.get('/GetPost2', async (req, rep) => {
    const { postIdx, strBlogId, strUID } = req.query as Record<string, any>;
    const idx = parseInt(postIdx, 10);
    if (isNaN(idx)) throw new APIError(APIErrorType.INVALID_REQUEST);

    const post = await prisma.blogPost.findUnique({
      where: {
        idx,
      },
    });

    if (!post) throw new APIError(APIErrorType.NOT_FOUND);

    const xml = XMLBuilder.create();
    const postContent = xml.ele('PostContent');

    const json = JSON.parse(post.contents);
    for (const content of json) {
      postContent
        .ele('PostContentEntity')
        .ele('Type')
        .txt(content?.type ?? '')
        .up()
        .ele('UrlOrText')
        .txt(content.value)
        .up()
        .up();
    }

    postContent.up();
    rep.send(xml.end());
  });

  app.get('/UploadPost', async (req, rep) => {
    const { Uid, title: cp949Title, bOpen, bAllowReply, fileList } = req.query as Record<string, any>;
    let { tag } = (req.query as Record<string, any>) || {};

    const user = await findOrRegisterUser(Uid);
    const blog = await findOrCreateBlog(user);

    if (tag.trim() === 'not found') tag = '';
    const contents = fileList
      .split('|')
      .filter((n: string) => n.trim() !== '')
      .map((n: string) => ({ value: n }));

    const title = iconv.decode(urlDecodeBytes(cp949Title), 'euc-kr');

    await prisma.blogPost.create({
      data: {
        title,
        contents: JSON.stringify(contents),

        imageUrl: contents.length > 0 ? contents[0].value : undefined,
        commentAllowed: bOpen === 'True',

        blogIdx: blog.idx,
      },
    });

    const xml = XMLBuilder.create();
    rep.send(xml.ele('boolean').txt('true').up().end());
  });

  app.get('/srchItem', async (req, rep) => {
    // srchItem, srchString, UId, page
    const pageSize = 5;

    const { srchItem, srchString, UId, page } = (req.body as Record<string, any>) || {};
    if ([srchItem, srchString, UId, page].find((n) => typeof n !== 'string'))
      throw new APIError(APIErrorType.INVALID_REQUEST);

    if (!Object.values(MintPadBlogSearchEnum).includes(srchItem)) throw new APIError(APIErrorType.INVALID_REQUEST);

    let queryBuilder = {};
    switch (srchItem) {
      case MintPadBlogSearchEnum.BLOGNAME:
        queryBuilder = {
          ...queryBuilder,
          blog: {
            name: { in: srchString },
          },
        };
        break;
      case MintPadBlogSearchEnum.NICKNAME:
        queryBuilder = {
          ...queryBuilder,
          blog: {
            owner: {
              nick: { in: srchString },
            },
          },
        };
        break;
      case MintPadBlogSearchEnum.SUBJECT:
        queryBuilder = {
          ...queryBuilder,
          title: { in: srchString },
        };
        break;
      case MintPadBlogSearchEnum.TAG:
        queryBuilder = {
          ...queryBuilder,
          title: { in: srchString },
        };
        break;
    }

    if (srchItem === MintPadBlogSearchEnum.BLOGNAME) {
      queryBuilder = {
        ...queryBuilder,
        blog: {
          name: {
            in: srchString,
          },
        },
      };
    }

    if (srchItem === MintPadBlogSearchEnum.BLOGNAME) {
      queryBuilder = {
        ...queryBuilder,
        blog: {
          name: {
            in: srchString,
          },
        },
      };
    }

    const posts = await prisma.blogPost.findMany({
      where: {
        ...queryBuilder,
      },
    });

    // TODO: Implement it later
    throw new APIError(APIErrorType.NOT_IMPLEMENTED);
  });

  app.get('/RecentPost', async (req, rep) => {
    const pageSize = 5;

    const posts = await prisma.blogPost.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: pageSize,
    });

    const xml = XMLBuilder.create();
    const postList = xml.ele('RecentPosts');

    for (const post of posts) {
      const ele = postList.ele('RecentPost');

      const blog = await prisma.blog.findUnique({
        where: {
          idx: post.blogIdx,
        },
      });

      ele
        .ele('BlogIdx')
        .txt(post.blogIdx.toString())
        .up()
        .ele('BloggerID')
        .txt(blog?.ownerId ?? '')
        .up()
        .ele('Title')
        .txt(post.title)
        .up()
        .ele('PictureFilename')
        .txt(post.imageUrl ?? '')
        .up()
        .ele('ImgURL')
        .txt(post.imageUrl ?? '')
        .up()
        .ele('RegDate')
        .txt(post.createdAt.toDateString())
        .up()
        .ele('AllowReply')
        .txt('0')
        .up()
        .ele('OpenStatus')
        .txt('0')
        .up();
    }

    postList.up();
    rep.send(xml.end());
  });

  app.get('/DeletePost', async (req, rep) => {
    const { UId: uid, postIdx } = req.query as Record<string, any>;
    const idx = parseInt(postIdx, 10);

    const xml = XMLBuilder.create();
    if (isNaN(idx)) return rep.send(xml.ele('boolean').txt('false').up().end());

    const post = await prisma.blogPost.findUnique({
      where: {
        idx,
      },
    });
    if (!post) return rep.send(xml.ele('boolean').txt('false').up().end());

    const blog = await prisma.blog.findUnique({
      where: {
        idx: post.blogIdx,
      },
    });
    if (blog?.ownerId !== uid) throw new APIError(APIErrorType.UNAUTHORIZED);

    await prisma.blogPost.delete({
      where: {
        idx,
      },
    });
    return rep.send(xml.ele('boolean').txt('true').up().end());
  });

  app.get('/GetPostList', async (req, rep) => {
    const { page: pageStr, strBlogId, strUID } = req.query as Record<string, any>;

    const xml = XMLBuilder.create();
    const blog = await prisma.blog.findUnique({
      where: {
        ownerId: strBlogId,
      },
    });

    if (!blog) {
      xml.ele('BlogExist').txt('1').up();
      return rep.send(xml.end());
    }

    let page = parseInt(pageStr, 10);
    page = isNaN(page) ? 1 : page;

    const postCount = await prisma.blogPost.count({
      where: {
        blogIdx: blog.idx,
      },
    });
    const pageSize = 5;

    const posts = await prisma.blogPost.findMany({
      where: {
        blogIdx: blog.idx,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const postList = xml.ele('PostList');
    postList
      .ele('BlogExist')
      .txt('0')
      .up()
      .ele('CurrentPage')
      .txt(page.toString())
      .up()
      .ele('TotalPageCount')
      .txt(Math.ceil(postCount / pageSize).toString())
      .up();

    for (const post of posts) {
      const ele = postList.ele('PostEntity');
      const user = await prisma.user.findUnique({ where: { id: blog.ownerId } });
      const createdAt = post.createdAt;
      const date = `${createdAt.getFullYear()}-${(createdAt.getMonth() + 1).toString().padStart(2, '0')}-${createdAt
        .getDate()
        .toString()
        .padStart(2, '0')}`;

      const comments = await prisma.blogPostComment.findMany({
        where: {
          postIdx: post.idx,
        },
      });

      ele
        .ele('Idx')
        .txt(post.idx.toString())
        .up()
        .ele('Title')
        .txt(post.title)
        .up()
        .ele('RegDate')
        .txt(date)
        .up()
        .ele('NickName')
        .txt(user?.nick ?? '')
        .up()
        .ele('UId')
        .txt(user?.id ?? '')
        .up()
        .ele('ImageUrl')
        .txt(post.imageUrl ?? '')
        .up()
        .ele('OpenStatus')
        .txt('0')
        .up()
        .ele('OpinionOpenStatus')
        .txt(post.commentAllowed ? '0' : '1')
        .up()
        .ele('Comment')
        .txt(comments.length.toString())
        .up()
        .ele('BlogIdx')
        .txt(post.blogIdx.toString())
        .up()
        .up();
    }

    postList.up();

    rep.send(xml.end());
  });

  done();
}
