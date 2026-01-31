
# AddMe Photo - Technical Implementation

A high-performance Flutter app implementing the "Add Me" photo merge feature using native OpenCV and AI modules.

## Technical Pipeline
1. **ORB Alignment**: Matches background features between shots.
2. **Segmentation**: 
   - **Android**: Google ML Kit (Offline).
   - **iOS**: Apple Vision Framework (Person Segmentation).
3. **Color Matching**: LAB space mean/std transfer.
4. **Feathered Blending**: Weighted alpha blending with edge softening.

## Prerequisites
- **Android**: Android Studio, Min SDK 24. OpenCV 4.9+ is handled via Maven.
- **iOS**: Xcode, Cocoapods. 

## Setup Instructions
1. Run `flutter pub get`.
2. **iOS Setup**: 
   - `cd ios && pod install`
   - Open `Runner.xcworkspace`.
   - Ensure a valid Team is selected in "Signing & Capabilities".
3. **Android Setup**:
   - Open the `android` folder in Android Studio.
   - The `build.gradle` automatically fetches ML Kit and OpenCV dependencies.

## Key Files
- `lib/services/native_bridge.dart`: Flutter interface to native code.
- `android/.../AddMeProcessor.kt`: Kotlin CV and ML logic.
- `ios/.../OpenCVWrapper.mm`: Objective-C++ OpenCV implementation.
