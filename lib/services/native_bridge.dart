
import 'package:flutter/services.dart';

class NativeBridge {
  static const _channel = MethodChannel('com.addme/processor');

  static Future<Map<String, dynamic>> mergePhotos({
    required String basePath,
    required String addPath,
    required String projectDir,
  }) async {
    try {
      final result = await _channel.invokeMethod('mergeAddMe', {
        'basePath': basePath,
        'addPath': addPath,
        'projectDir': projectDir,
      });
      return Map<String, dynamic>.from(result);
    } catch (e) {
      return {'error': e.toString()};
    }
  }
}
