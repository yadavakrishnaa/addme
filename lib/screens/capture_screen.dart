
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:path_provider/path_provider.dart';
import 'package:uuid/uuid.dart';
import 'merge_progress_screen.dart';

class CaptureScreen extends StatefulWidget {
  const CaptureScreen({super.key});

  @override
  State<CaptureScreen> createState() => _CaptureScreenState();
}

class _CaptureScreenState extends State<CaptureScreen> {
  CameraController? _controller;
  XFile? _shotA;
  double _opacity = 0.5;
  bool _isInitialized = false;

  @override
  void initState() {
    super.initState();
    _initCamera();
  }

  Future<void> _initCamera() async {
    final cameras = await availableCameras();
    if (cameras.isEmpty) return;
    _controller = CameraController(cameras[0], ResolutionPreset.high, enableAudio: false);
    await _controller!.initialize();
    if (mounted) setState(() => _isInitialized = true);
  }

  Future<void> _capture() async {
    if (_controller == null || !_controller!.value.isInitialized) return;
    final file = await _controller!.takePicture();
    
    if (_shotA == null) {
      setState(() => _shotA = file);
    } else {
      _proceed(file);
    }
  }

  void _proceed(XFile shotB) async {
    final dir = await getApplicationDocumentsDirectory();
    final id = const Uuid().v4();
    final path = '${dir.path}/projects/$id';
    await Directory(path).create(recursive: true);

    final fileA = await File(_shotA!.path).copy('$path/A.jpg');
    final fileB = await File(shotB.path).copy('$path/B.jpg');

    if (!mounted) return;
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(
        builder: (_) => MergeProgressScreen(
          basePath: fileA.path,
          addPath: fileB.path,
          projectId: id,
          projectDir: path,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (!_isInitialized) return const Scaffold(body: Center(child: CircularProgressIndicator()));

    return Scaffold(
      body: Stack(
        fit: StackFit.expand,
        children: [
          CameraPreview(_controller!),
          if (_shotA != null)
            Opacity(
              opacity: _opacity,
              child: Image.file(File(_shotA!.path), fit: BoxFit.cover),
            ),
          Positioned(
            bottom: 60,
            left: 0,
            right: 0,
            child: Column(
              children: [
                if (_shotA != null)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 50),
                    child: Slider(
                      value: _opacity,
                      activeColor: Colors.white,
                      onChanged: (v) => setState(() => _opacity = v),
                    ),
                  ),
                const SizedBox(height: 20),
                GestureDetector(
                  onTap: _capture,
                  child: Container(
                    height: 80, width: 80,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white, width: 4),
                    ),
                    child: Center(
                      child: Container(height: 60, width: 60, decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle)),
                    ),
                  ),
                ),
                const SizedBox(height: 15),
                Text(_shotA == null ? "Capture Step 1: Background" : "Capture Step 2: Add Me", style: const TextStyle(fontWeight: FontWeight.bold)),
              ],
            ),
          ),
          Positioned(top: 40, left: 20, child: IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context))),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }
}
