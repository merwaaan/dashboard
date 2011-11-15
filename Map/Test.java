import java.util.List;

import org.graphstream.graph.Graph;
import org.graphstream.graph.Node;
import org.graphstream.graph.implementations.DefaultGraph;
import org.graphstream.stream.file.FileSource;
import org.graphstream.stream.file.FileSourceDGS;
import org.graphstream.algorithm.Dijkstra;
import org.graphstream.algorithm.Dijkstra.Element;

public class Test {

	 private Graph graph;

	 public Test() {
		  
		  this.graph = new DefaultGraph("autoroutes");

		  FileSource fs = new FileSourceDGS();
		  fs.addSink(this.graph);
		  try {
				fs.readAll("autoroutes.dgs");
		  }
		  catch(Exception e) {
				System.out.println(e);
		  }

		  graph.display();

		  this.compute();
	 }

	 public void compute() {

		  String from = "LeHavre";
		  String to = "Marseille";

		  Dijkstra dijkstra = new Dijkstra(Element.edge, "weight", from);
		  dijkstra.init(this.graph);
		  dijkstra.compute();

		  Node fromNode = this.graph.getNode(from);
		  Node toNode = this.graph.getNode(to);

		  List<Node> path = dijkstra.getShortestPath(toNode).getNodePath();

		  StringBuilder sb = new StringBuilder();
		  System.out.println(path.size());
		  sb.append("[");
		  for(Node n : path) {
				sb.append("\"");
				sb.append(n.getId());
				sb.append("\"");
		  }
		  sb.append("]");

		  System.out.println(sb.toString());
	 }

	 public static void main(String[] args) {

		  new Test();
	 }
}
