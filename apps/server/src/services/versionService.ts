// Version service: create, list, get, and restore prompt versions.
// Uses the PromptVersion model from Prisma schema.

import prisma from '../db/client';

export interface CreateVersionInput {
  promptId: string;
  changeNote?: string;
}

export async function createVersion(input: CreateVersionInput) {
  const { promptId, changeNote } = input;

  const prompt = await prisma.prompt.findUnique({
    where: { id: promptId },
    include: {
      tags: { include: { tag: true } },
    },
  });

  if (!prompt) {
    throw new Error(`Prompt not found: ${promptId}`);
  }

  const latestVersion = await prisma.promptVersion.findFirst({
    where: { promptId },
    orderBy: { versionNumber: 'desc' },
    select: { versionNumber: true },
  });

  const nextVersionNumber = (latestVersion?.versionNumber ?? 0) + 1;
  const tagNames = prompt.tags.map((pt) => pt.tag.name);

  const version = await prisma.promptVersion.create({
    data: {
      promptId: prompt.id,
      versionNumber: nextVersionNumber,
      title: prompt.title,
      description: prompt.description,
      content: prompt.content,
      categoryId: prompt.categoryId,
      tags: JSON.stringify(tagNames),
      changeNote: changeNote ?? '',
    },
  });

  return version;
}

export async function getVersions(promptId: string) {
  const versions = await prisma.promptVersion.findMany({
    where: { promptId },
    orderBy: { versionNumber: 'desc' },
  });

  return versions.map((v) => ({
    ...v,
    tags: JSON.parse(v.tags),
  }));
}

export async function getVersion(promptId: string, versionNumber: number) {
  const version = await prisma.promptVersion.findUnique({
    where: {
      promptId_versionNumber: {
        promptId,
        versionNumber,
      },
    },
  });

  if (!version) {
    throw new Error(`Version ${versionNumber} not found for prompt ${promptId}`);
  }

  return {
    ...version,
    tags: JSON.parse(version.tags),
  };
}

export async function restoreVersion(promptId: string, versionNumber: number, changeNote?: string) {
  const version = await prisma.promptVersion.findUnique({
    where: {
      promptId_versionNumber: { promptId, versionNumber },
    },
  });

  if (!version) {
    throw new Error(`Version ${versionNumber} not found for prompt ${promptId}`);
  }

  // Snapshot current state before restoring
  await createVersion({
    promptId,
    changeNote: changeNote ?? `Auto-snapshot before restoring version ${versionNumber}`,
  });

  // Resolve tag relations
  const tagNames: string[] = JSON.parse(version.tags);

  await prisma.promptTagRelation.deleteMany({
    where: { promptId },
  });

  for (const tagName of tagNames) {
    const tag = await prisma.promptTag.upsert({
      where: { name: tagName },
      update: {},
      create: { name: tagName },
    });
    await prisma.promptTagRelation.create({
      data: { promptId, tagId: tag.id },
    });
  }

  const updatedPrompt = await prisma.prompt.update({
    where: { id: promptId },
    data: {
      title: version.title,
      description: version.description,
      content: version.content,
      categoryId: version.categoryId,
    },
  });

  return updatedPrompt;
}
