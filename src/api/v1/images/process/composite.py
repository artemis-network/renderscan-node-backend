import sys
from PIL import Image


def getCompositeImage(inputFile, maskFile, outputFile):
    try:
        ref = Image.open(inputFile)
        iwidth, iheight = ref.size
        empty = Image.new("RGBA", ref.size, 0)
        mask = Image.open(maskFile).convert("L").resize(
            (iwidth, iheight), resample=Image.BICUBIC, reducing_gap=2.0
        )
        img = Image.composite(ref, empty, mask)
        img_scaled = img.resize((img.size[0] * 3, img.size[1] * 3))
        img_scaled = img_scaled.rotate(270)
        img_scaled.save(outputFile)
        return True
    except Exception as e:
        print(e)
        return False


if __name__ == '__main__':
    if len(sys.argv) >= 3:
        cutReceivedFilePath = sys.argv[1]
        cutMaskFilePath = sys.argv[2]
        currentCutFilePath = sys.argv[3]
        response = getCompositeImage(
            cutReceivedFilePath, cutMaskFilePath, currentCutFilePath)
        print(response)
    else:
        print("min 3 arguments are required")
    sys.stdout.flush()
