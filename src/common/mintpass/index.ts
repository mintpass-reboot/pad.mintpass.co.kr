import { Blog, User } from '@prisma/client';
import { prisma } from '../..';

export async function findOrRegisterUser(uid: string): Promise<User> {
  const user = await prisma.user.findFirst({
    where: {
      id: uid,
    },
  });
  if (user) return user;

  return await prisma.user.create({
    data: {
      id: uid,
      name: uid,
      nick: uid,
    },
  });
}

export async function findOrCreateBlog(user: User): Promise<Blog> {
  const blog = await prisma.blog.findFirst({
    where: {
      ownerId: user.id,
    },
  });
  if (blog) return blog;

  return await prisma.blog.create({
    data: {
      ownerId: user.id,
      name: user.id + '의 블로그',
    },
  });
}
