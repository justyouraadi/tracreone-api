import { Readable } from "stream";
import type { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import type { AuthenticatedRequest } from "../../middlewares/auth";
import { ApiError } from "../../middlewares/errorHandler";
import { ObjectStorageService, ObjectNotFoundError } from "../../lib/objectStorage";

const objectStorageService = new ObjectStorageService();

export async function requestUploadUrl(req: AuthenticatedRequest, res: Response) {
  const { name, size, contentType } = req.body;
  const uploadURL = await objectStorageService.getObjectEntityUploadURL();
  const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);
  res.json({ uploadURL, objectPath, metadata: { name, size, contentType } });
}

export async function confirmUpload(req: AuthenticatedRequest, res: Response) {
  const { objectPath, fileName, mimeType, sizeBytes, category, leadId } = req.body;

  if (leadId) {
    const lead = await prisma.leads.findUnique({ where: { id: leadId } });
    if (!lead) throw new ApiError(404, "Lead not found");
    if (req.auth!.role !== "super_admin" && lead.companyId !== null && lead.companyId !== req.auth!.companyId) {
      throw new ApiError(404, "Lead not found");
    }
  }

  const fileAsset = await prisma.fileAsset.create({
    data: {
      companyId: req.auth!.companyId,
      uploadedBy: req.auth!.sub,
      leadId: leadId ?? null,
      objectPath,
      fileName,
      mimeType,
      sizeBytes,
      category,
    },
  });

  res.status(201).json({ fileAsset });
}

export async function listUploads(req: AuthenticatedRequest, res: Response) {
  const companyId = req.auth!.companyId!;
  const leadId = req.query.leadId ? Number(req.query.leadId) : undefined;
  const fileAssets = await prisma.fileAsset.findMany({
    where: { companyId, ...(leadId ? { leadId } : {}) },
    orderBy: { createdAt: "desc" },
  });
  res.json({ fileAssets });
}

export async function deleteUpload(req: AuthenticatedRequest, res: Response) {
  const id = Number(req.params.id);
  const fileAsset = await prisma.fileAsset.findUnique({ where: { id } });
  if (!fileAsset || fileAsset.companyId !== req.auth!.companyId) throw new ApiError(404, "File not found");
  await prisma.fileAsset.delete({ where: { id } });
  res.status(204).send();
}

export async function servePublicObject(req: Request, res: Response) {
  const raw = req.params.filePath;
  const filePath = Array.isArray(raw) ? raw.join("/") : raw;
  const file = await objectStorageService.searchPublicObject(filePath);
  if (!file) throw new ApiError(404, "File not found");

  const response = await objectStorageService.downloadObject(file);
  res.status(response.status);
  response.headers.forEach((value, key) => res.setHeader(key, value));
  if (response.body) {
    Readable.fromWeb(response.body as ReadableStream<Uint8Array>).pipe(res);
  } else {
    res.end();
  }
}

export async function serveObject(req: AuthenticatedRequest, res: Response) {
  const raw = req.params.path;
  const wildcardPath = Array.isArray(raw) ? raw.join("/") : raw;
  const objectPath = `/objects/${wildcardPath}`;

  // Authorization: every uploaded object is recorded in FileAsset with the
  // owning companyId. Require a matching, company-scoped FileAsset row
  // before streaming the file — otherwise any authenticated user could
  // guess/enumerate another company's object path and read its file
  // (IDOR). super_admin bypasses the company check, consistent with rbac.ts.
  const fileAsset = await prisma.fileAsset.findFirst({ where: { objectPath } });
  if (!fileAsset) throw new ApiError(404, "File not found");
  if (req.auth!.role !== "super_admin" && fileAsset.companyId !== req.auth!.companyId) {
    throw new ApiError(404, "File not found");
  }

  try {
    const objectFile = await objectStorageService.getObjectEntityFile(objectPath);
    const response = await objectStorageService.downloadObject(objectFile);
    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));
    if (response.body) {
      Readable.fromWeb(response.body as ReadableStream<Uint8Array>).pipe(res);
    } else {
      res.end();
    }
  } catch (err) {
    if (err instanceof ObjectNotFoundError) throw new ApiError(404, "File not found");
    throw err;
  }
}
