
package com.addme.photo

import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.opencv.android.OpenCVLoader

class MainActivity: FlutterActivity() {
    private val CHANNEL = "com.addme/processor"

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        
        // Initialize OpenCV
        if (!OpenCVLoader.initDebug()) {
            println("OpenCV initialization failed.")
        }

        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL).setMethodCallHandler { call, result ->
            if (call.method == "mergeAddMe") {
                val basePath = call.argument<String>("basePath")
                val addPath = call.argument<String>("addPath")
                val projectId = call.argument<String>("projectId")
                val projectDir = call.argument<String>("projectDir")

                if (basePath != null && addPath != null && projectId != null && projectDir != null) {
                    val processor = AddMeProcessor(this)
                    
                    CoroutineScope(Dispatchers.Main).launch {
                        try {
                            val mergeResult = withContext(Dispatchers.Default) {
                                processor.process(basePath, addPath, projectDir)
                            }
                            result.success(mergeResult)
                        } catch (e: Exception) {
                            result.error("PROCESS_ERROR", e.message, null)
                        }
                    }
                } else {
                    result.error("INVALID_ARGS", "Missing arguments", null)
                }
            } else {
                result.notImplemented()
            }
        }
    }
}
