
#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

@interface OpenCVWrapper : NSObject

+ (NSDictionary *)mergeAddMe:(NSString *)basePath 
                     addPath:(NSString *)addPath 
                  projectDir:(NSString *)projectDir 
                    maskData:(NSData *)maskData 
                   maskWidth:(int)maskWidth 
                  maskHeight:(int)maskHeight;

@end
