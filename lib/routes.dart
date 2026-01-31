
import 'package:flutter/material.dart';
import 'screens/home_screen.dart';
import 'screens/capture_screen.dart';
import 'screens/gallery_screen.dart';

class AppRoutes {
  static const String home = '/';
  static const String capture = '/capture';
  static const String gallery = '/gallery';

  static Route<dynamic> generateRoute(RouteSettings settings) {
    switch (settings.name) {
      case home:
        return MaterialPageRoute(builder: (_) => const HomeScreen());
      case capture:
        return MaterialPageRoute(builder: (_) => const CaptureScreen());
      case gallery:
        return MaterialPageRoute(builder: (_) => const GalleryScreen());
      default:
        return MaterialPageRoute(
          builder: (_) => Scaffold(
            body: Center(child: Text('No route defined for ${settings.name}')),
          ),
        );
    }
  }
}
