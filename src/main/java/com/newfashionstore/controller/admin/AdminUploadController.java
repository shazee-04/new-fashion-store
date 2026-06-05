package com.newfashionstore.controller.admin;

import com.newfashionstore.annotations.AdminOnly;
import com.newfashionstore.dto.ResponseDTO;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.glassfish.jersey.media.multipart.FormDataContentDisposition;
import org.glassfish.jersey.media.multipart.FormDataParam;

import java.io.*;
import java.util.UUID;

@Path("/admin/upload")
@AdminOnly
public class AdminUploadController {

    @POST
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    public Response uploadFile(
            @FormDataParam("file") InputStream fileInputStream,
            @FormDataParam("file") FormDataContentDisposition fileDetail,
            @QueryParam("type") String type,
            @Context HttpServletRequest request) {

        ResponseDTO response = new ResponseDTO();
        if (fileInputStream == null || fileDetail == null) {
            response.setSuccess(false);
            response.setMessage("No file uploaded");
            return Response.status(Response.Status.BAD_REQUEST).entity(response).build();
        }

        if (type == null || type.trim().isEmpty()) {
            type = "products";
        }

        try {
            // Safe directory resolution
            if (!type.equals("products") && !type.equals("banners") && !type.equals("brand")) {
                type = "products";
            }

            String originalName = fileDetail.getFileName();
            String extension = "";
            int extIndex = originalName.lastIndexOf('.');
            if (extIndex > 0) {
                extension = originalName.substring(extIndex);
            }

            String uniqueName = UUID.randomUUID().toString() + extension;
            String relativePath = "assets/images/" + type + "/" + uniqueName;

            // Save to deployed webapp folder
            String webappPath = request.getServletContext().getRealPath("/assets/images/" + type);
            if (webappPath != null) {
                File uploadDir = new File(webappPath);
                if (!uploadDir.exists()) {
                    uploadDir.mkdirs();
                }
                File targetFile = new File(uploadDir, uniqueName);
                saveFile(fileInputStream, targetFile);
            }

            // Also try to save to source folder so it persists across builds
            // The project directory on disk is c:\Users\mgssr\IdeaProjects\NewFashionStore
            String sourcePath = "c:\\Users\\mgssr\\IdeaProjects\\NewFashionStore\\src\\main\\webapp\\assets\\images\\" + type;
            File sourceDir = new File(sourcePath);
            if (sourceDir.exists()) {
                File targetSourceFile = new File(sourceDir, uniqueName);
                // Re-open/copy if we have the file on disk, or copy from deployed location
                if (webappPath != null) {
                    File deployedFile = new File(webappPath, uniqueName);
                    if (deployedFile.exists()) {
                        try (InputStream in = new FileInputStream(deployedFile);
                             OutputStream out = new FileOutputStream(targetSourceFile)) {
                            byte[] buffer = new byte[1024];
                            int length;
                            while ((length = in.read(buffer)) > 0) {
                                out.write(buffer, 0, length);
                            }
                        }
                    }
                }
            }

            response.setSuccess(true);
            response.setMessage("File uploaded successfully");
            response.setData(relativePath);
            return Response.ok(response).build();

        } catch (Exception e) {
            response.setSuccess(false);
            response.setMessage("Failed to upload file: " + e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(response).build();
        }
    }

    private void saveFile(InputStream inStream, File targetFile) throws IOException {
        try (OutputStream out = new FileOutputStream(targetFile)) {
            byte[] bytes = new byte[4096];
            int read;
            while ((read = inStream.read(bytes)) != -1) {
                out.write(bytes, 0, read);
            }
        }
    }
}
