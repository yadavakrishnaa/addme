
import 'package:flutter/material.dart';
import '../services/native_bridge.dart';
import 'result_screen.dart';

class MergeProgressScreen extends StatefulWidget {
  final String basePath;
  final String addPath;
  final String projectId;
  final String projectDir;

  const MergeProgressScreen({
    super.key,
    required this.basePath,
    required this.addPath,
    required this.projectId,
    required this.projectDir,
  });

  @override
  State<MergeProgressScreen> createState() => _MergeProgressScreenState();
}

class _MergeProgressScreenState extends State<MergeProgressScreen> {
  String _statusText = "Aligning frames...";
  bool _hasError = false;
  String? _errorMsg;

  @override
  void initState() {
    super.initState();
    _startMerge();
  }

  Future<void> _startMerge() async {
    setState(() => _statusText = "Analyzing and Aligning...");
    
    // Simulate some status updates for better UX if needed, 
    // though the native bridge is a single call.
    
    final result = await NativeBridge.mergePhotos(
      basePath: widget.basePath,
      addPath: widget.addPath,
      projectId: widget.projectId,
      projectDir: widget.projectDir,
    );

    if (!mounted) return;

    if (result.errorMessage != null) {
      setState(() {
        _hasError = true;
        _errorMsg = result.errorMessage;
      });
    } else {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => ResultScreen(
            resultPath: result.outputPath,
            confidence: result.alignmentConfidence,
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(40.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (!_hasError) ...[
                const CircularProgressIndicator(),
                const SizedBox(height: 30),
                Text(
                  _statusText,
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 18),
                ),
                const SizedBox(height: 10),
                const Text(
                  "Keep your phone steady during capture for better results.",
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.grey),
                ),
              ] else ...[
                const Icon(Icons.error_outline, color: Colors.red, size: 60),
                const SizedBox(height: 20),
                const Text(
                  "Merge Failed",
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 10),
                Text(
                  _errorMsg ?? "Unknown error occurred",
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Colors.red),
                ),
                const SizedBox(height: 30),
                ElevatedButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text("Go Back and Retake"),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
