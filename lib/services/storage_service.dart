
import 'dart:io';
import 'dart:convert';
import 'package:path_provider/path_provider.dart';

class ProjectItem {
  final String id;
  final String path;
  final DateTime date;

  ProjectItem({required this.id, required this.path, required this.date});
}

class StorageService {
  static Future<List<ProjectItem>> getAllProjects() async {
    final dir = await getApplicationDocumentsDirectory();
    final projectsDir = Directory('${dir.path}/projects');
    
    if (!await projectsDir.exists()) return [];

    final List<ProjectItem> items = [];
    final list = projectsDir.listSync();
    
    for (var entity in list) {
      if (entity is Directory) {
        final id = entity.path.split('/').last;
        final outImg = File('${entity.path}/out.jpg');
        if (await outImg.exists()) {
          items.add(ProjectItem(
            id: id,
            path: outImg.path,
            date: await outImg.lastModified(),
          ));
        }
      }
    }
    
    items.sort((a, b) => b.date.compareTo(a.date));
    return items;
  }
}
