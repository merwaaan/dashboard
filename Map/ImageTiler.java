import javax.imageio.ImageIO;
import java.io.File;
import java.io.IOException;
import java.awt.*;
import java.awt.image.BufferedImage;

public class ImageTiler {
	 protected String baseDir="resources/";
	 protected int tileWidth=100;
	 protected int tileHeight=100;

	 public static void main( String args[] ) {
		  try {
				new ImageTiler( args );
		  } catch( IOException e ) {
				e.printStackTrace();
		  }
	 }

	 public ImageTiler( String args[] )
		  throws IOException {
		  if( args.length == 0 ) {
				System.err.printf( "Usage : ImageTimer <image>%n" );
				System.err.printf( "  Images are put in directory %s that must exist%n", baseDir );
		  }
		  for( int z=0; z<args.length; ++z ) {

				String source = args[z];

				BufferedImage img = null;
				try {
					img = ImageIO.read( new File( source ) );
				}
				catch (Exception e) {
					 System.out.println(e.toString());
				}

				int cols=img.getWidth()/tileWidth;
				int rows=img.getHeight()/tileHeight;

				System.out.println(img);
				System.out.println(cols+ " columns");
				System.out.println(rows+" rows");
				System.out.println((cols * rows)+" tiles");

				for( int x=0; x<cols; ++x ) {
					 for( int y=0; y<rows; ++y ) {

						  BufferedImage tile= new BufferedImage(tileWidth,
																			 tileHeight,
																			 BufferedImage.TYPE_INT_RGB);

						  Graphics2D gfx= (Graphics2D) tile.getGraphics();

						  gfx.drawImage(img, 0, 0,
											 tileWidth, tileHeight,
											 tileWidth * x, tileHeight * y,
											 tileWidth * x + tileWidth,
											 tileHeight * y + tileHeight,
											 null);

						  ImageIO.write(tile, "JPG", new File(baseDir +
																		  "tiles/x" + x + "y" + y
																		  + "z" + z + ".jpg"));
					 }
				}
		  }
	 }
}
