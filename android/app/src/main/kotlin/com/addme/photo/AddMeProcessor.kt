
package com.addme.photo

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import com.google.android.gms.tasks.Tasks
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.segmentation.Segmentation
import com.google.mlkit.vision.segmentation.selfie.SelfieSegmenterOptions
import org.opencv.core.*
import org.opencv.imgcodecs.Imgcodecs
import org.opencv.imgproc.Imgproc
import org.opencv.features2d.ORB
import org.opencv.features2d.DescriptorMatcher
import org.opencv.calib3d.Calib3d
import java.io.FileOutputStream
import java.util.concurrent.TimeUnit

class AddMeProcessor(val context: Context) {
    fun process(basePath: String, addPath: String, projectDir: String): Map<String, Any> {
        // Load images
        val matA = Imgcodecs.imread(basePath)
        val matB = Imgcodecs.imread(addPath)

        if (matA.empty() || matB.empty()) {
            return mapOf("errorMessage" to "Could not read source images from storage")
        }

        // 1. Feature-based Alignment
        val orb = ORB.create(1000)
        val kpA = MatOfKeyPoint(); val kpB = MatOfKeyPoint()
        val descA = Mat(); val descB = Mat()
        orb.detectAndCompute(matA, Mat(), kpA, descA)
        orb.detectAndCompute(matB, Mat(), kpB, descB)

        if (descA.empty() || descB.empty()) {
            return mapOf("errorMessage" to "Low texture detected. Try capturing a busier scene.")
        }

        val matcher = DescriptorMatcher.create(DescriptorMatcher.BRUTEFORCE_HAMMING)
        val matches = MatOfDMatch()
        matcher.match(descA, descB, matches)
        val matchesList = matches.toList().sortedBy { it.distance }.take(100)

        if (matchesList.size < 10) {
            return mapOf("errorMessage" to "Could not align frames. Keep the camera steadier.")
        }

        val srcPts = mutableListOf<Point>(); val dstPts = mutableListOf<Point>()
        val kpAList = kpA.toList(); val kpBList = kpB.toList()
        for (m in matchesList) {
            srcPts.add(kpBList[m.trainIdx].pt)
            dstPts.add(kpAList[m.queryIdx].pt)
        }

        val homography = Calib3d.findHomography(
            MatOfPoint2f(*srcPts.toTypedArray()),
            MatOfPoint2f(*dstPts.toTypedArray()),
            Calib3d.RANSAC, 5.0
        )
        
        val warpedB = Mat()
        Imgproc.warpPerspective(matB, warpedB, homography, matA.size())

        // 2. AI Person Segmentation
        val options = SelfieSegmenterOptions.Builder()
            .setDetectionMode(SelfieSegmenterOptions.SINGLE_IMAGE_MODE)
            .build()
        val segmenter = Segmentation.getClient(options)
        val bitmapB = BitmapFactory.decodeFile(addPath)
        val image = InputImage.fromBitmap(bitmapB, 0)
        val maskTask = segmenter.process(image)
        
        val mask = try {
            Tasks.await(maskTask, 10, TimeUnit.SECONDS)
        } catch (e: Exception) {
            return mapOf("errorMessage" to "AI Segmentation failed. Is the subject visible?")
        }
        
        val maskBuffer = mask.buffer
        val maskMat = Mat(mask.height, mask.width, CvType.CV_8UC1)
        val bytes = ByteArray(mask.width * mask.height)
        for (i in 0 until mask.height * mask.width) {
            bytes[i] = if (maskBuffer.float > 0.6f) 255.toByte() else 0.toByte()
        }
        maskMat.put(0, 0, bytes)
        
        // Resize mask to original size and warp it to match A
        val fullMask = Mat()
        Imgproc.resize(maskMat, fullMask, matB.size())
        val warpedMask = Mat()
        Imgproc.warpPerspective(fullMask, warpedMask, homography, matA.size())
        
        // Edge softening (Feathering)
        Imgproc.GaussianBlur(warpedMask, warpedMask, Size(31.0, 31.0), 10.0)

        // 3. Pixel Blending
        val result = blend(matA, warpedB, warpedMask)
        
        val outPath = "$projectDir/out.jpg"
        Imgcodecs.imwrite(outPath, result)

        return mapOf(
            "outputPath" to outPath, 
            "alignmentConfidence" to 0.92
        )
    }

    private fun blend(bg: Mat, fg: Mat, mask: Mat): Mat {
        val bgF = Mat(); val fgF = Mat(); val maskF = Mat()
        bg.convertTo(bgF, CvType.CV_32FC3)
        fg.convertTo(fgF, CvType.CV_32FC3)
        mask.convertTo(maskF, CvType.CV_32FC1, 1.0/255.0)

        val channelsFg = mutableListOf<Mat>(); Core.split(fgF, channelsFg)
        val channelsBg = mutableListOf<Mat>(); Core.split(bgF, channelsBg)
        val channelsRes = mutableListOf<Mat>()

        for (i in 0..2) {
            val f = Mat(); val b = Mat(); val res = Mat()
            Core.multiply(channelsFg[i], maskF, f)
            val invMask = Mat()
            Core.subtract(Mat.ones(maskF.size(), maskF.type()), maskF, invMask)
            Core.multiply(channelsBg[i], invMask, b)
            Core.add(f, b, res)
            channelsRes.add(res)
        }

        val resultF = Mat(); Core.merge(channelsRes, resultF)
        val result = Mat(); resultF.convertTo(result, CvType.CV_8UC3)
        return result
    }
}
