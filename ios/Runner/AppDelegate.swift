
import UIKit
import Flutter
import Vision

@UIApplicationMain
@objc class AppDelegate: FlutterAppDelegate {
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    
    let controller : FlutterViewController = window?.rootViewController as! FlutterViewController
    let processorChannel = FlutterMethodChannel(name: "com.addme/processor",
                                              binaryMessenger: controller.binaryMessenger)
    
    processorChannel.setMethodCallHandler({
      (call: FlutterMethodCall, result: @escaping FlutterResult) -> Void in
      if call.method == "mergeAddMe" {
        guard let args = call.arguments as? [String: Any],
              let basePath = args["basePath"] as? String,
              let addPath = args["addPath"] as? String,
              let projectDir = args["projectDir"] as? String else {
          result(FlutterError(code: "INVALID_ARGS", message: nil, details: nil))
          return
        }
        
        // Process in background
        DispatchQueue.global(qos: .userInitiated).async {
          self.runPipeline(basePath: basePath, addPath: addPath, projectDir: projectDir, result: result)
        }
      } else {
        result(FlutterMethodNotImplemented)
      }
    })

    GeneratedPluginRegistrant.register(with: self)
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
    
    private func runPipeline(basePath: String, addPath: String, projectDir: String, result: @escaping FlutterResult) {
        // 1. iOS Vision Segmentation
        guard let image = UIImage(contentsOfFile: addPath),
              let cgImage = image.cgImage else {
            DispatchQueue.main.async { result(["error": "Could not load image"]) }
            return
        }
        
        let request = VNGeneratePersonSegmentationRequest()
        request.qualityLevel = .balanced
        let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
        
        do {
            try handler.perform([request])
            if let mask = request.results?.first {
                let maskBuffer = mask.pixelBuffer
                
                // Convert pixel buffer to Data for OpenCV
                let data = self.dataFromPixelBuffer(maskBuffer)
                let w = CVPixelBufferGetWidth(maskBuffer)
                let h = CVPixelBufferGetHeight(maskBuffer)
                
                // 2. Call OpenCV Wrapper (ObjC++)
                let out = OpenCVWrapper.mergeAddMe(basePath, addPath: addPath, projectDir: projectDir, maskData: data, maskWidth: Int32(w), maskHeight: Int32(h))
                
                DispatchQueue.main.async {
                    result(out)
                }
            }
        } catch {
            DispatchQueue.main.async { result(["error": "Vision segmentation failed"]) }
        }
    }
    
    private func dataFromPixelBuffer(_ pixelBuffer: CVPixelBuffer) -> Data {
        CVPixelBufferLockBaseAddress(pixelBuffer, .readOnly)
        defer { CVPixelBufferUnlockBaseAddress(pixelBuffer, .readOnly) }
        
        let address = CVPixelBufferGetBaseAddress(pixelBuffer)
        let size = CVPixelBufferGetDataSize(pixelBuffer)
        return Data(bytes: address!, count: size)
    }
}
