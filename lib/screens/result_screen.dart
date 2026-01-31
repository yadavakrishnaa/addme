
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';

class ResultScreen extends StatelessWidget {
  final String resultPath;
  final double confidence;

  const ResultScreen({
    super.key,
    required this.resultPath,
    required this.confidence,
  });

  void _share() {
    Share.shareXFiles([XFile(resultPath)], text: "Look at my AddMe photo!");
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Result"),
        actions: [
          IconButton(onPressed: _share, icon: const Icon(Icons.share)),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: InteractiveViewer(
              child: Image.file(
                File(resultPath),
                fit: BoxFit.contain,
              ),
            ),
          ),
          Container(
            padding: const EdgeInsets.all(20),
            color: Colors.black87,
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text("Alignment Quality:", style: TextStyle(color: Colors.white70)),
                    Text(
                      "${(confidence * 100).toStringAsFixed(1)}%",
                      style: TextStyle(
                        color: confidence > 0.4 ? Colors.green : Colors.orange,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(backgroundColor: Colors.blue),
                        onPressed: () => Navigator.popUntil(context, (r) => r.isFirst),
                        child: const Text("Done"),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
